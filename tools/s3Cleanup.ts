/**
 * S3 Orphan Asset Cleanup
 *
 * Scans every database column and JSONB structure that can reference an
 * assets.pubpub.org file, builds a Set of all referenced S3 keys, then
 * lists the S3 bucket and deletes (or reports) objects not in that set.
 *
 * Usage:
 *   pnpm run tools-prod s3Cleanup                 # dry-run: writes orphans to tmp/orphans.txt
 *   pnpm run tools-prod s3Cleanup --quarantine     # soft-delete: set orphans to private ACL (reversible)
 *   pnpm run tools-prod s3Cleanup --execute        # hard-delete: permanently remove orphan objects
 *   pnpm run tools-prod s3Cleanup --unquarantine KEY [KEY...]  # restore specific keys to public-read
 *   pnpm run tools-prod s3Cleanup --resume         # resume from last saved S3 list marker
 *   pnpm run tools-prod s3Cleanup --skip-s3-list   # reuse tmp/orphans.txt from a previous run
 *   pnpm run tools-prod s3Cleanup --min-age-days=180  # only treat objects older than 180 days as candidates
 *
 * How it works:
 *   Phase 1 — Scan every DB table/column and extract all assets.pubpub.org keys
 *   Phase 2 — Stream-list every object in the S3 bucket, check against the set
 *   Phase 3 — Quarantine (private ACL), delete, or log orphan keys
 *
 * For a ~2 TB bucket with millions of objects this will take hours (S3
 * ListObjectsV2 returns 1 000 keys per page). The script is designed to be
 * restartable: it writes progress checkpoints so you can ctrl-C and --resume.
 *
 * Safety:
 *   - Objects younger than 1 year (--min-age-days=365 default) are NEVER
 *     considered orphans, preventing race conditions where a file was just
 *     uploaded but not yet committed to the database
 *   - Uses a generous regex to catch assets.pubpub.org URLs in any format
 *     (resize-v3, resize, Fastly IO query params, raw, protocol-relative)
 *   - Scans raw HTML columns (`LayoutBlockHtml.content.html`) with regex
 *   - Scans all JSONB DocJson trees recursively (Docs, ThreadComments,
 *     Releases, Reviews, Submissions, SubmissionWorkflows, DraftCheckpoints,
 *     Page/Collection layout text blocks, submission banner bodies)
 *   - Skips _testing/ prefix keys (test assets)
 *   - Skips fonts/ prefix keys (app font files managed by upload-fonts-to-s3.sh)
 *   - In --execute mode, deletes in batches of 1 000 using DeleteObjects API
 *   - In --quarantine mode, sets ACL to private (object stays, URL returns 403)
 *     This is fully reversible with --unquarantine
 *   - Writes a full tmp/orphans.txt manifest before deleting anything
 */

/* biome-ignore-all lint/suspicious/noConsole: CLI tool */

import {
	DeleteObjectsCommand,
	DeleteObjectTaggingCommand,
	ListObjectsV2Command,
	PutObjectAclCommand,
	PutObjectTaggingCommand,
	S3Client,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

import { sequelize } from 'server/sequelize';

// ─── Config ──────────────────────────────────────────────────────────────────

const BUCKET = 'assets.pubpub.org';
const BACKUP_BUCKET = 'assets.backup.pubpub.org';
const REGION = 'us-east-1';
const S3_LIST_PAGE_SIZE = 1000; // max allowed by AWS
const DELETE_BATCH_SIZE = 1000; // max allowed by DeleteObjects
// Write output files into <project-root>/tmp/ so they're accessible outside Docker
// and already gitignored.
const TMP_DIR = path.resolve(__dirname, '..', 'tmp');
fs.mkdirSync(TMP_DIR, { recursive: true });
const ORPHAN_FILE = path.join(TMP_DIR, 'orphans.txt');
const MARKER_FILE = path.join(TMP_DIR, 's3-cleanup-marker.txt');
const DEFAULT_MIN_AGE_DAYS = 365; // 1 year — ignore anything newer
const QUARANTINE_BATCH_SIZE = 50; // PutObjectAcl is per-object, so keep concurrency modest

const execute = process.argv.includes('--execute');
const quarantine = process.argv.includes('--quarantine');
const unquarantineIdx = process.argv.indexOf('--unquarantine');
const resume = process.argv.includes('--resume');
const skipS3List = process.argv.includes('--skip-s3-list');

/** Parse --min-age-days=N from argv (defaults to 365). */
const minAgeDays = (() => {
	const flag = process.argv.find((a) => a.startsWith('--min-age-days='));
	if (flag) {
		const n = Number(flag.split('=')[1]);
		if (Number.isFinite(n) && n >= 0) return n;
	}
	return DEFAULT_MIN_AGE_DAYS;
})();
const minAgeMs = minAgeDays * 24 * 60 * 60 * 1000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const log = (msg: string) => console.log(`[s3Cleanup] ${msg}`);
const warn = (msg: string) => console.warn(`[s3Cleanup] ⚠ ${msg}`);

/**
 * Extracts the S3 key from any URL that references assets.pubpub.org.
 *
 * Handles:
 *   https://assets.pubpub.org/KEY
 *   https://assets.pubpub.org/KEY?width=...
 *   //assets.pubpub.org/KEY
 *   https://resize-v3.pubpub.org/BASE64   → decodes to { key }
 *   https://resize.pubpub.org/fit-in/WxH/KEY
 *   https://s3-external-1.amazonaws.com/assets.pubpub.org/KEY
 */
function extractS3Key(url: string): string | null {
	if (!url || typeof url !== 'string') return null;

	// resize-v3: base64-encoded JSON with { key: "..." }
	if (url.includes('resize-v3.pubpub.org/')) {
		try {
			const b64 = url.split('resize-v3.pubpub.org/')[1].split(/[?#]/)[0];
			const json = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
			if (json.key) return json.key;
		} catch {
			// fall through
		}
	}

	// resize v1 (Thumbor): https://resize.pubpub.org/fit-in/WxH/KEY
	if (url.includes('resize.pubpub.org/')) {
		const afterHost = url.split('resize.pubpub.org/')[1];
		if (afterHost) {
			const parts = afterHost.split('/');
			for (let i = 0; i < parts.length; i++) {
				if (/^\d+x\d+$/.test(parts[i])) {
					const key = parts.slice(i + 1).join('/');
					if (key) return key;
				}
			}
		}
	}

	// Direct: https://assets.pubpub.org/KEY or //assets.pubpub.org/KEY
	// Also: https://s3-external-1.amazonaws.com/assets.pubpub.org/KEY
	const directMatch = url.match(
		/(?:https?:)?\/\/(?:s3-external-1\.amazonaws\.com\/)?assets\.pubpub\.org\/([^\s?"'<>]+)/,
	);
	if (directMatch) {
		return directMatch[1];
	}

	return null;
}

/**
 * Regex that broadly matches any assets.pubpub.org URL in a block of text.
 * Used to scan raw HTML strings where we can't rely on structured data.
 */
const ASSET_URL_REGEX =
	/(?:https?:)?\/\/(?:(?:resize(?:-v3)?|s3-external-1\.amazonaws\.com\/assets)\.pubpub\.org|assets\.pubpub\.org)\/[^\s"'<>)]+/g;

function extractKeysFromText(text: string): string[] {
	if (!text || typeof text !== 'string') return [];
	const keys: string[] = [];
	for (const match of text.matchAll(ASSET_URL_REGEX)) {
		const key = extractS3Key(match[0]);
		if (key) keys.push(key);
	}
	return keys;
}

/**
 * Recursively walk a ProseMirror DocJson tree and extract all S3 keys
 * from node attrs (image, audio, video, file, iframe) and mark attrs (link).
 */
function extractKeysFromDocJson(doc: any): string[] {
	const keys: string[] = [];
	if (!doc || typeof doc !== 'object') return keys;

	function walk(node: any) {
		if (!node || typeof node !== 'object') return;

		// Check node attrs
		if (node.attrs) {
			for (const attr of ['url', 'href', 'src']) {
				const val = node.attrs[attr];
				if (typeof val === 'string') {
					const key = extractS3Key(val);
					if (key) keys.push(key);
				}
			}
		}

		// Check marks
		if (Array.isArray(node.marks)) {
			for (const mark of node.marks) {
				if (mark.attrs) {
					for (const attr of ['href', 'url', 'src']) {
						const val = mark.attrs[attr];
						if (typeof val === 'string') {
							const key = extractS3Key(val);
							if (key) keys.push(key);
						}
					}
				}
			}
		}

		// Recurse into children
		if (Array.isArray(node.content)) {
			for (const child of node.content) {
				walk(child);
			}
		}
	}

	walk(doc);
	return keys;
}

// ─── Phase 1: Scan the Database ─────────────────────────────────────────────

async function collectReferencedKeys(): Promise<Set<string>> {
	const keys = new Set<string>();
	let totalKeys = 0;

	function add(key: string | null) {
		if (key) {
			keys.add(key);
			totalKeys++;
		}
	}

	function addAll(extracted: string[]) {
		for (const k of extracted) add(k);
	}

	// Helper: run a SQL query that returns rows with a `url` column, extract keys
	async function scanTextColumn(label: string, sql: string) {
		log(`  Scanning ${label}...`);
		const [rows] = (await sequelize.query(sql)) as [Array<{ url: string }>, unknown];
		let count = 0;
		for (const row of rows) {
			const key = extractS3Key(row.url);
			if (key) {
				add(key);
				count++;
			}
		}
		log(`    → ${count} keys from ${rows.length} rows`);
	}

	// Helper: run a SQL query that returns `content` JSONB, extract keys from DocJson.
	// Uses keyset pagination (ORDER BY id, LIMIT) to avoid loading the entire
	// table into memory — Docs alone can be hundreds of thousands of large JSON blobs.
	const DOC_BATCH_SIZE = 500;
	async function scanDocJsonColumn(label: string, table: string, column: string) {
		log(`  Scanning ${label}...`);
		let count = 0;
		let totalRows = 0;
		let lastId = '00000000-0000-0000-0000-000000000000';

		while (true) {
			// biome-ignore lint/performance/noAwaitInLoops: intentional sequential batching to limit memory
			const [rows] = (await sequelize.query(
				`SELECT id, "${column}" AS content FROM "${table}"
				 WHERE "${column}" IS NOT NULL AND id > :lastId
				 ORDER BY id LIMIT :limit`,
				{ replacements: { lastId, limit: DOC_BATCH_SIZE } },
			)) as [Array<{ id: string; content: any }>, unknown];

			if (rows.length === 0) break;
			totalRows += rows.length;

			for (const row of rows) {
				const doc = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
				const extracted = extractKeysFromDocJson(doc);
				count += extracted.length;
				addAll(extracted);
			}

			lastId = rows[rows.length - 1].id;

			if (rows.length < DOC_BATCH_SIZE) break;
		}
		log(`    → ${count} keys from ${totalRows} rows`);
	}

	log('Phase 1: Scanning database for all referenced S3 keys...');

	// ── 1a. Simple TEXT avatar/image URL columns ─────────────────────────

	await scanTextColumn(
		'Community images',
		`SELECT avatar AS url FROM "Communities" WHERE avatar IS NOT NULL
		 UNION ALL SELECT favicon FROM "Communities" WHERE favicon IS NOT NULL
		 UNION ALL SELECT "headerLogo" FROM "Communities" WHERE "headerLogo" IS NOT NULL
		 UNION ALL SELECT "heroLogo" FROM "Communities" WHERE "heroLogo" IS NOT NULL
		 UNION ALL SELECT "heroBackgroundImage" FROM "Communities" WHERE "heroBackgroundImage" IS NOT NULL
		 UNION ALL SELECT "heroImage" FROM "Communities" WHERE "heroImage" IS NOT NULL
		 UNION ALL SELECT "footerImage" FROM "Communities" WHERE "footerImage" IS NOT NULL`,
	);

	await scanTextColumn(
		'Pub avatars',
		`SELECT avatar AS url FROM "Pubs" WHERE avatar IS NOT NULL`,
	);
	await scanTextColumn(
		'Page avatars',
		`SELECT avatar AS url FROM "Pages" WHERE avatar IS NOT NULL`,
	);
	await scanTextColumn(
		'Collection avatars',
		`SELECT avatar AS url FROM "Collections" WHERE avatar IS NOT NULL`,
	);
	await scanTextColumn(
		'User avatars',
		`SELECT avatar AS url FROM "Users" WHERE avatar IS NOT NULL`,
	);
	await scanTextColumn(
		'PubAttribution avatars',
		`SELECT avatar AS url FROM "PubAttributions" WHERE avatar IS NOT NULL`,
	);
	await scanTextColumn(
		'CollectionAttribution avatars',
		`SELECT avatar AS url FROM "CollectionAttributions" WHERE avatar IS NOT NULL`,
	);
	await scanTextColumn(
		'ExternalPublication avatars',
		`SELECT avatar AS url FROM "ExternalPublications" WHERE avatar IS NOT NULL`,
	);
	await scanTextColumn('Export URLs', `SELECT url FROM "Exports" WHERE url IS NOT NULL`);

	// ── 1b. PubHeaderTheme facet (backgroundImage TEXT) ──────────────────

	await scanTextColumn(
		'PubHeaderTheme backgroundImage',
		`SELECT "backgroundImage" AS url FROM "PubHeaderTheme" WHERE "backgroundImage" IS NOT NULL`,
	);

	// ── 1c. Pub downloads JSONB → [{url: ...}] ──────────────────────────

	log('  Scanning Pub downloads...');
	{
		const [rows] = (await sequelize.query(
			`SELECT id, downloads FROM "Pubs" WHERE downloads IS NOT NULL AND downloads != '[]'::jsonb`,
		)) as [Array<{ id: string; downloads: any[] }>, unknown];
		let count = 0;
		for (const row of rows) {
			const downloads = Array.isArray(row.downloads) ? row.downloads : [];
			for (const dl of downloads) {
				if (dl && typeof dl.url === 'string') {
					const key = extractS3Key(dl.url);
					if (key) {
						add(key);
						count++;
					}
				}
			}
		}
		log(`    → ${count} keys from ${rows.length} rows`);
	}

	// ── 1d. Layout JSONB — banner backgroundImage ───────────────────────

	log('  Scanning Page layout banners...');
	{
		const [rows] = (await sequelize.query(
			`SELECT p.id, block->'content'->>'backgroundImage' AS url
			 FROM "Pages" p, jsonb_array_elements(p.layout) AS block
			 WHERE p.layout IS NOT NULL
			   AND block->>'type' = 'banner'
			   AND block->'content'->>'backgroundImage' IS NOT NULL`,
		)) as [Array<{ url: string }>, unknown];
		let count = 0;
		for (const row of rows) {
			const key = extractS3Key(row.url);
			if (key) {
				add(key);
				count++;
			}
		}
		log(`    → ${count} keys from ${rows.length} rows`);
	}

	log('  Scanning Collection layout banners...');
	{
		const [rows] = (await sequelize.query(
			`SELECT c.id, block->'content'->>'backgroundImage' AS url
			 FROM "Collections" c, jsonb_array_elements(c.layout->'blocks') AS block
			 WHERE c.layout IS NOT NULL
			   AND block->>'type' = 'banner'
			   AND block->'content'->>'backgroundImage' IS NOT NULL`,
		)) as [Array<{ url: string }>, unknown];
		let count = 0;
		for (const row of rows) {
			const key = extractS3Key(row.url);
			if (key) {
				add(key);
				count++;
			}
		}
		log(`    → ${count} keys from ${rows.length} rows`);
	}

	// ── 1e. Layout JSONB — text blocks with DocJson ─────────────────────

	log('  Scanning Page layout text blocks...');
	{
		const [rows] = (await sequelize.query(
			`SELECT block->'content'->'text' AS content
			 FROM "Pages" p, jsonb_array_elements(p.layout) AS block
			 WHERE p.layout IS NOT NULL
			   AND block->>'type' = 'text'
			   AND block->'content'->'text' IS NOT NULL`,
		)) as [Array<{ content: any }>, unknown];
		let count = 0;
		for (const row of rows) {
			const doc = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
			const extracted = extractKeysFromDocJson(doc);
			count += extracted.length;
			addAll(extracted);
		}
		log(`    → ${count} keys from ${rows.length} rows`);
	}

	log('  Scanning Collection layout text blocks...');
	{
		const [rows] = (await sequelize.query(
			`SELECT block->'content'->'text' AS content
			 FROM "Collections" c, jsonb_array_elements(c.layout->'blocks') AS block
			 WHERE c.layout IS NOT NULL
			   AND block->>'type' = 'text'
			   AND block->'content'->'text' IS NOT NULL`,
		)) as [Array<{ content: any }>, unknown];
		let count = 0;
		for (const row of rows) {
			const doc = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
			const extracted = extractKeysFromDocJson(doc);
			count += extracted.length;
			addAll(extracted);
		}
		log(`    → ${count} keys from ${rows.length} rows`);
	}

	// ── 1f. Layout JSONB — submission-banner body (DocJson) ──────────────

	log('  Scanning Page layout submission-banner bodies...');
	{
		const [rows] = (await sequelize.query(
			`SELECT block->'content'->'body' AS content
			 FROM "Pages" p, jsonb_array_elements(p.layout) AS block
			 WHERE p.layout IS NOT NULL
			   AND block->>'type' = 'submission-banner'
			   AND block->'content'->'body' IS NOT NULL`,
		)) as [Array<{ content: any }>, unknown];
		let count = 0;
		for (const row of rows) {
			const doc = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
			const extracted = extractKeysFromDocJson(doc);
			count += extracted.length;
			addAll(extracted);
		}
		log(`    → ${count} keys from ${rows.length} rows`);
	}

	// ── 1g. Layout JSONB — HTML blocks (regex scan raw HTML) ─────────────

	log('  Scanning Page layout HTML blocks...');
	{
		const [rows] = (await sequelize.query(
			`SELECT block->'content'->>'html' AS html
			 FROM "Pages" p, jsonb_array_elements(p.layout) AS block
			 WHERE p.layout IS NOT NULL
			   AND block->>'type' = 'html'
			   AND block->'content'->>'html' IS NOT NULL`,
		)) as [Array<{ html: string }>, unknown];
		let count = 0;
		for (const row of rows) {
			const extracted = extractKeysFromText(row.html);
			count += extracted.length;
			addAll(extracted);
		}
		log(`    → ${count} keys from ${rows.length} rows`);
	}

	log('  Scanning Collection layout HTML blocks...');
	{
		const [rows] = (await sequelize.query(
			`SELECT block->'content'->>'html' AS html
			 FROM "Collections" c, jsonb_array_elements(c.layout->'blocks') AS block
			 WHERE c.layout IS NOT NULL
			   AND block->>'type' = 'html'
			   AND block->'content'->>'html' IS NOT NULL`,
		)) as [Array<{ html: string }>, unknown];
		let count = 0;
		for (const row of rows) {
			const extracted = extractKeysFromText(row.html);
			count += extracted.length;
			addAll(extracted);
		}
		log(`    → ${count} keys from ${rows.length} rows`);
	}

	// ── 1h. Banner text field (raw HTML string) ──────────────────────────

	log('  Scanning Page layout banner text (HTML)...');
	{
		const [rows] = (await sequelize.query(
			`SELECT block->'content'->>'text' AS html
			 FROM "Pages" p, jsonb_array_elements(p.layout) AS block
			 WHERE p.layout IS NOT NULL
			   AND block->>'type' = 'banner'
			   AND block->'content'->>'text' IS NOT NULL`,
		)) as [Array<{ html: string }>, unknown];
		let count = 0;
		for (const row of rows) {
			const extracted = extractKeysFromText(row.html);
			count += extracted.length;
			addAll(extracted);
		}
		log(`    → ${count} keys from ${rows.length} rows`);
	}

	// ── 1h-b. Collection layout banner text (raw HTML string) ──────────

	log('  Scanning Collection layout banner text (HTML)...');
	{
		const [rows] = (await sequelize.query(
			`SELECT block->'content'->>'text' AS html
			 FROM "Collections" c, jsonb_array_elements(c.layout->'blocks') AS block
			 WHERE c.layout IS NOT NULL
			   AND block->>'type' = 'banner'
			   AND block->'content'->>'text' IS NOT NULL`,
		)) as [Array<{ html: string }>, unknown];
		let count = 0;
		for (const row of rows) {
			const extracted = extractKeysFromText(row.html);
			count += extracted.length;
			addAll(extracted);
		}
		log(`    → ${count} keys from ${rows.length} rows`);
	}

	// ── 1h-c. Collection layout submission-banner body (DocJson) ────────

	log('  Scanning Collection layout submission-banner bodies...');
	{
		const [rows] = (await sequelize.query(
			`SELECT block->'content'->'body' AS content
			 FROM "Collections" c, jsonb_array_elements(c.layout->'blocks') AS block
			 WHERE c.layout IS NOT NULL
			   AND block->>'type' = 'submission-banner'
			   AND block->'content'->'body' IS NOT NULL`,
		)) as [Array<{ content: any }>, unknown];
		let count = 0;
		for (const row of rows) {
			const doc = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
			const extracted = extractKeysFromDocJson(doc);
			count += extracted.length;
			addAll(extracted);
		}
		log(`    → ${count} keys from ${rows.length} rows`);
	}

	// ── 1i. DocJson columns — the big ones ──────────────────────────────

	await scanDocJsonColumn('Docs content', 'Docs', 'content');
	await scanDocJsonColumn('ThreadComment content', 'ThreadComments', 'content');
	await scanDocJsonColumn('Release noteContent', 'Releases', 'noteContent');
	await scanDocJsonColumn('ReviewNew reviewContent', 'ReviewNews', 'reviewContent');
	await scanDocJsonColumn('Submission abstract', 'Submissions', 'abstract');

	// SubmissionWorkflow has 5 DocJson columns
	for (const col of [
		'instructionsText',
		'acceptedText',
		'declinedText',
		'receivedEmailText',
		'introText',
	]) {
		// biome-ignore lint/performance/noAwaitInLoops: intentional sequential queries
		await scanDocJsonColumn(`SubmissionWorkflow ${col}`, 'SubmissionWorkflows', col);
	}

	await scanDocJsonColumn('DraftCheckpoint doc', 'DraftCheckpoints', 'doc');

	// ── 1j. LandingPageFeature payload.imageUrl ──────────────────────────

	log('  Scanning LandingPageFeature payload...');
	{
		const [rows] = (await sequelize.query(
			`SELECT payload->>'imageUrl' AS url
			 FROM "LandingPageFeatures"
			 WHERE payload->>'imageUrl' IS NOT NULL`,
		)) as [Array<{ url: string }>, unknown];
		let count = 0;
		for (const row of rows) {
			const key = extractS3Key(row.url);
			if (key) {
				add(key);
				count++;
			}
		}
		log(`    → ${count} keys from ${rows.length} rows`);
	}

	// ── 1k. ActivityItems — scan the entire payload JSONB for asset URLs ─

	log('  Scanning ActivityItem payloads (regex, may be slow)...');
	{
		const [rows] = (await sequelize.query(
			`SELECT payload::text AS text
			 FROM "ActivityItems"
			 WHERE payload::text LIKE '%assets.pubpub.org%'`,
		)) as [Array<{ text: string }>, unknown];
		let count = 0;
		for (const row of rows) {
			const extracted = extractKeysFromText(row.text);
			count += extracted.length;
			addAll(extracted);
		}
		log(`    → ${count} keys from ${rows.length} rows`);
	}

	// ── 1l. CustomScripts — could embed asset URLs in script/CSS text ───

	log('  Scanning CustomScripts...');
	{
		const [rows] = (await sequelize.query(
			`SELECT content::text AS text FROM "CustomScripts" WHERE content::text LIKE '%assets.pubpub.org%'`,
		)) as [Array<{ text: string }>, unknown];
		let count = 0;
		for (const row of rows) {
			const extracted = extractKeysFromText(row.text);
			count += extracted.length;
			addAll(extracted);
		}
		log(`    → ${count} keys from ${rows.length} rows`);
	}

	// ── 1m. Pub htmlTitle / htmlDescription (may contain <img> with asset) ─

	log('  Scanning Pub htmlTitle / htmlDescription...');
	{
		const [rows] = (await sequelize.query(
			`SELECT "htmlTitle" AS text FROM "Pubs" WHERE "htmlTitle" LIKE '%assets.pubpub.org%'
			 UNION ALL
			 SELECT "htmlDescription" FROM "Pubs" WHERE "htmlDescription" LIKE '%assets.pubpub.org%'`,
		)) as [Array<{ text: string }>, unknown];
		let count = 0;
		for (const row of rows) {
			const extracted = extractKeysFromText(row.text);
			count += extracted.length;
			addAll(extracted);
		}
		log(`    → ${count} keys from ${rows.length} rows`);
	}

	// ── 1n. Community heroText (rendered as HTML in hero section) ────────

	log('  Scanning Community heroText...');
	{
		const [rows] = (await sequelize.query(
			`SELECT "heroText" AS text FROM "Communities" WHERE "heroText" LIKE '%assets.pubpub.org%'`,
		)) as [Array<{ text: string }>, unknown];
		let count = 0;
		for (const row of rows) {
			const extracted = extractKeysFromText(row.text);
			count += extracted.length;
			addAll(extracted);
		}
		log(`    → ${count} keys from ${rows.length} rows`);
	}

	// ── 1o. WorkerTask input/output (import/export tasks reference assets) ─

	log('  Scanning WorkerTask input/output...');
	{
		const [rows] = (await sequelize.query(
			`SELECT input::text AS text FROM "WorkerTasks" WHERE input::text LIKE '%assets.pubpub.org%'
			 UNION ALL
			 SELECT output::text FROM "WorkerTasks" WHERE output::text LIKE '%assets.pubpub.org%'`,
		)) as [Array<{ text: string }>, unknown];
		let count = 0;
		for (const row of rows) {
			const extracted = extractKeysFromText(row.text);
			count += extracted.length;
			addAll(extracted);
		}
		log(`    → ${count} keys from ${rows.length} rows`);
	}

	log(`Phase 1 complete: ${keys.size} unique S3 keys referenced (${totalKeys} total references)`);
	return keys;
}

// ─── Phase 2 & 3: List S3 and Identify/Delete Orphans ───────────────────────

async function listAndCleanS3(referencedKeys: Set<string>) {
	const s3 = new S3Client({
		region: REGION,
		credentials: {
			accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
		},
	});

	const orphanStream = fs.createWriteStream(ORPHAN_FILE, { flags: resume ? 'a' : 'w' });

	let continuationToken: string | undefined;
	if (resume && fs.existsSync(MARKER_FILE)) {
		continuationToken = fs.readFileSync(MARKER_FILE, 'utf-8').trim();
		log(`Resuming from marker: ${continuationToken}`);
	}

	let totalListed = 0;
	let orphanCount = 0;
	let referencedCount = 0;
	let skippedTooNew = 0;
	let totalSizeBytes = 0;
	let orphanSizeBytes = 0;
	let pageCount = 0;
	let hasMore = true;

	const cutoffDate = new Date(Date.now() - minAgeMs);
	log(`Phase 2: Listing S3 bucket and identifying orphans...`);
	log(
		`  Only considering objects older than ${minAgeDays} days (before ${cutoffDate.toISOString()})`,
	);

	while (hasMore) {
		const command = new ListObjectsV2Command({
			Bucket: BUCKET,
			MaxKeys: S3_LIST_PAGE_SIZE,
			ContinuationToken: continuationToken,
		});

		// biome-ignore lint/performance/noAwaitInLoops: paginated S3 listing must be sequential
		const response = await s3.send(command);
		const objects = response.Contents ?? [];
		pageCount++;

		for (const obj of objects) {
			const key = obj.Key;
			if (!key) continue;
			totalListed++;
			const size = obj.Size ?? 0;
			totalSizeBytes += size;

			// Skip _testing/ prefix (test assets) and fonts/ prefix (app font files)
			if (key.startsWith('_testing/') || key.startsWith('fonts/')) continue;

			// Safety: never touch objects newer than the age threshold.
			// This prevents race conditions where a file was just uploaded
			// but hasn't been committed to the DB yet (or our DB read missed it).
			if (obj.LastModified && obj.LastModified > cutoffDate) {
				skippedTooNew++;
				continue;
			}

			if (referencedKeys.has(key)) {
				referencedCount++;
			} else {
				orphanCount++;
				orphanSizeBytes += size;
				orphanStream.write(`${key}\t${size}\n`);
			}
		}

		// Save marker for resume
		continuationToken = response.NextContinuationToken;
		if (continuationToken) {
			fs.writeFileSync(MARKER_FILE, continuationToken);
		}
		hasMore = response.IsTruncated ?? false;

		if (pageCount % 100 === 0) {
			const pct = ((referencedCount / totalListed) * 100).toFixed(1);
			log(
				`  ...page ${pageCount}: ${totalListed.toLocaleString()} objects listed, ` +
					`${referencedCount.toLocaleString()} referenced (${pct}%), ` +
					`${orphanCount.toLocaleString()} orphans ` +
					`(${(orphanSizeBytes / 1e9).toFixed(1)} GB)`,
			);
		}
	}

	orphanStream.end();
	await new Promise<void>((resolve) => orphanStream.on('finish', resolve));

	log(`Phase 2 complete:`);
	log(`  Total objects listed: ${totalListed.toLocaleString()}`);
	log(`  Total size: ${(totalSizeBytes / 1e12).toFixed(2)} TB`);
	log(`  Skipped (newer than ${minAgeDays}d): ${skippedTooNew.toLocaleString()}`);
	log(`  Referenced: ${referencedCount.toLocaleString()}`);
	log(`  Orphans: ${orphanCount.toLocaleString()} (${(orphanSizeBytes / 1e9).toFixed(1)} GB)`);
	log(`  Orphan list written to: ${ORPHAN_FILE}`);

	// Clean up marker
	if (fs.existsSync(MARKER_FILE)) fs.unlinkSync(MARKER_FILE);

	return { orphanCount, orphanSizeBytes };
}

async function deleteOrphans(referencedKeys: Set<string>) {
	if (!fs.existsSync(ORPHAN_FILE)) {
		warn(`No ${ORPHAN_FILE} found. Run without --skip-s3-list first.`);
		return;
	}

	const s3 = new S3Client({
		region: REGION,
		credentials: {
			accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
		},
	});

	const rl = readline.createInterface({
		input: fs.createReadStream(ORPHAN_FILE),
		crlfDelay: Infinity,
	});

	let batch: string[] = [];
	let totalDeleted = 0;
	let skippedNowReferenced = 0;
	let backupErrors = 0;

	async function flushBatch() {
		if (batch.length === 0) return;

		const deletePayload = {
			Delete: {
				Objects: batch.map((key) => ({ Key: key })),
				Quiet: true as const,
			},
		};

		// Delete from primary bucket
		const primaryResult = await s3.send(
			new DeleteObjectsCommand({ Bucket: BUCKET, ...deletePayload }),
		);
		const primaryErrors = primaryResult.Errors ?? [];
		if (primaryErrors.length > 0) {
			warn(
				`  ${primaryErrors.length} primary delete errors (first: ${primaryErrors[0].Key} → ${primaryErrors[0].Message})`,
			);
		}

		// Delete from backup bucket (best-effort — don't fail the run)
		try {
			const backupResult = await s3.send(
				new DeleteObjectsCommand({ Bucket: BACKUP_BUCKET, ...deletePayload }),
			);
			const bErrors = backupResult.Errors ?? [];
			if (bErrors.length > 0) {
				backupErrors += bErrors.length;
			}
		} catch (err) {
			// Log but don't abort — backup bucket may use different credentials or not exist
			warn(`  Backup bucket delete failed: ${err}`);
			backupErrors += batch.length;
		}

		totalDeleted += batch.length - primaryErrors.length;
		batch = [];

		if (totalDeleted % 10_000 === 0) {
			log(`  ...deleted ${totalDeleted.toLocaleString()} objects so far`);
		}
	}

	log('Phase 3: Deleting orphan objects...');

	for await (const line of rl) {
		const key = line.split('\t')[0];
		if (!key) continue;

		// Re-validate: skip keys that are now referenced in the DB.
		// This catches assets that became referenced between the
		// orphan list being generated and --execute being run.
		if (referencedKeys.has(key)) {
			skippedNowReferenced++;
			continue;
		}

		batch.push(key);

		if (batch.length >= DELETE_BATCH_SIZE) {
			await flushBatch();
		}
	}

	// Flush remaining
	await flushBatch();

	log(`Phase 3 complete: ${totalDeleted.toLocaleString()} objects deleted`);
	if (skippedNowReferenced > 0) {
		log(
			`  Skipped ${skippedNowReferenced.toLocaleString()} keys that are now referenced in the DB`,
		);
	}
	if (backupErrors > 0) {
		warn(
			`  ${backupErrors.toLocaleString()} backup bucket delete errors (primary deletes still succeeded)`,
		);
	}
}

// ─── Main ────────────────────────────────────────────────────────────────────

/** Set ACL to 'private' on orphan keys — makes them return 403 but keeps the data. */
async function quarantineOrphans(referencedKeys: Set<string>) {
	if (!fs.existsSync(ORPHAN_FILE)) {
		warn(`No ${ORPHAN_FILE} found. Run without --skip-s3-list first.`);
		return;
	}

	const s3 = new S3Client({
		region: REGION,
		credentials: {
			accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
		},
	});

	const rl = readline.createInterface({
		input: fs.createReadStream(ORPHAN_FILE),
		crlfDelay: Infinity,
	});

	let totalQuarantined = 0;
	let skippedNowReferenced = 0;
	let errors = 0;
	let batch: string[] = [];

	async function flushBatch() {
		const quarantineDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
		const results = await Promise.allSettled(
			batch.map(async (key) => {
				// Set ACL to private (403 on public URLs)
				await s3.send(
					new PutObjectAclCommand({
						Bucket: BUCKET,
						Key: key,
						ACL: 'private',
					}),
				);
				// Tag for lifecycle rule matching + informational date
				await s3.send(
					new PutObjectTaggingCommand({
						Bucket: BUCKET,
						Key: key,
						Tagging: {
							TagSet: [
								{ Key: 'quarantined', Value: 'true' },
								{ Key: 'quarantined-date', Value: quarantineDate },
							],
						},
					}),
				);
			}),
		);
		for (const r of results) {
			if (r.status === 'fulfilled') {
				totalQuarantined++;
			} else {
				errors++;
			}
		}
		batch = [];

		if (totalQuarantined % 5_000 === 0 && totalQuarantined > 0) {
			log(`  ...quarantined ${totalQuarantined.toLocaleString()} objects so far`);
		}
	}

	log('Phase 3: Quarantining orphan objects (setting ACL to private)...');

	for await (const line of rl) {
		const key = line.split('\t')[0];
		if (!key) continue;

		if (referencedKeys.has(key)) {
			skippedNowReferenced++;
			continue;
		}

		batch.push(key);

		if (batch.length >= QUARANTINE_BATCH_SIZE) {
			await flushBatch();
		}
	}

	await flushBatch();

	log(
		`Phase 3 complete: ${totalQuarantined.toLocaleString()} objects quarantined (ACL → private)`,
	);
	if (skippedNowReferenced > 0) {
		log(
			`  Skipped ${skippedNowReferenced.toLocaleString()} keys that are now referenced in the DB`,
		);
	}
	if (errors > 0) {
		warn(`  ${errors.toLocaleString()} ACL update errors`);
	}
	log('  To undo: pnpm run tools-prod s3Cleanup --unquarantine <key> [<key>...]');
}

/** Restore specific keys back to public-read. */
async function unquarantineKeys(keys: string[]) {
	const s3 = new S3Client({
		region: REGION,
		credentials: {
			accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
		},
	});

	log(`Restoring ${keys.length} key(s) to public-read...`);
	let restored = 0;
	let errors = 0;

	for (const key of keys) {
		try {
			// biome-ignore lint/performance/noAwaitInLoops: intentional sequential restore
			await s3.send(
				new PutObjectAclCommand({
					Bucket: BUCKET,
					Key: key,
					ACL: 'public-read',
				}),
			);
			// Remove quarantine tag
			await s3.send(
				new DeleteObjectTaggingCommand({
					Bucket: BUCKET,
					Key: key,
				}),
			);
			log(`  ✓ ${key}`);
			restored++;
		} catch (err) {
			warn(`  ✗ ${key}: ${err}`);
			errors++;
		}
	}

	log(`Done: ${restored} restored, ${errors} errors`);
}

/**
 * Prompts the user for confirmation via stdin. Returns true if they type 'y' or 'yes'.
 */
async function confirm(message: string): Promise<boolean> {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	return new Promise((resolve) => {
		rl.question(`${message} [y/N] `, (answer) => {
			rl.close();
			resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
		});
	});
}

async function main() {
	// Handle --unquarantine as a standalone command (no DB scan needed)
	if (unquarantineIdx !== -1) {
		const keys = process.argv.slice(unquarantineIdx + 1).filter((a) => !a.startsWith('--'));
		if (keys.length === 0) {
			warn('Usage: pnpm run tools-prod s3Cleanup --unquarantine <key> [<key>...]');
			process.exit(1);
		}
		await unquarantineKeys(keys);
		return;
	}

	const mode = execute
		? 'EXECUTE (will delete!)'
		: quarantine
			? 'QUARANTINE (ACL → private)'
			: 'DRY-RUN (report only)';
	log(`Mode: ${mode}`);

	// Phase 1: Always scan DB (fast relative to Phase 2)
	const referencedKeys = await collectReferencedKeys();

	if (!skipS3List) {
		// S3 ListObjectsV2 charges ~$5 per million requests. For a large bucket
		// with millions of objects, a full listing costs roughly $10+.
		const ok = await confirm(
			'\n⚠️  This will list every object in the S3 bucket, which costs ~$10 in LIST request fees.\n' +
				'   Use --skip-s3-list to reuse a previous orphans.txt instead.\n' +
				'   Continue?',
		);
		if (!ok) {
			log('Aborted.');
			process.exit(0);
		}
		// Phase 2: List S3 bucket and write orphans
		await listAndCleanS3(referencedKeys);
	} else {
		log('Skipping S3 listing (--skip-s3-list). Using existing orphans.txt.');
	}

	// Phase 3: Act on orphans
	if (execute) {
		await deleteOrphans(referencedKeys);
	} else if (quarantine) {
		await quarantineOrphans(referencedKeys);
	} else {
		log('Dry run complete. Review orphans.txt, then re-run with --quarantine or --execute.');
	}
}

main()
	.then(() => {
		log('Done!');
	})
	.catch((err) => {
		console.error('[s3Cleanup] Fatal error:', err);
		process.exit(1);
	})
	.finally(() => process.exit(0));
