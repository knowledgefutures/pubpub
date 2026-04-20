/**
 * Rewrite S3 URLs to CDN-friendly assets.pubpub.org URLs
 *
 * Finds all database values containing direct S3 URLs like:
 *   https://s3.amazonaws.com/assets.pubpub.org/...
 *   https://s3-external-1.amazonaws.com/assets.pubpub.org/...
 * and rewrites them to the CDN-friendly form:
 *   https://assets.pubpub.org/...
 *
 * Usage:
 *   pnpm run tools rewriteS3Urls              # dry-run (reports counts, changes nothing)
 *   pnpm run tools rewriteS3Urls --execute    # actually rewrites URLs
 */

import { sequelize } from 'server/sequelize';

const execute = process.argv.includes('--execute');

const log = (msg: string) => console.log(`[rewriteS3Urls] ${msg}`);

// All the S3 URL prefixes we want to rewrite, mapped to the CDN replacement.
const REWRITES = [
	{
		label: 's3.amazonaws.com',
		find: 'https://s3.amazonaws.com/assets.pubpub.org/',
		replace: 'https://assets.pubpub.org/',
	},
	{
		label: 's3-external-1.amazonaws.com',
		find: 'https://s3-external-1.amazonaws.com/assets.pubpub.org/',
		replace: 'https://assets.pubpub.org/',
	},
];

// ─── Text columns ────────────────────────────────────────────────────────────

/** Simple TEXT columns that store a single URL. */
const TEXT_COLUMNS: Array<{ table: string; column: string }> = [
	{ table: 'Communities', column: 'avatar' },
	{ table: 'Communities', column: 'favicon' },
	{ table: 'Communities', column: 'headerLogo' },
	{ table: 'Communities', column: 'heroLogo' },
	{ table: 'Communities', column: 'heroBackgroundImage' },
	{ table: 'Communities', column: 'heroImage' },
	{ table: 'Communities', column: 'footerImage' },
	{ table: 'Pubs', column: 'avatar' },
	{ table: 'Pages', column: 'avatar' },
	{ table: 'Collections', column: 'avatar' },
	{ table: 'Users', column: 'avatar' },
	{ table: 'PubAttributions', column: 'avatar' },
	{ table: 'CollectionAttributions', column: 'avatar' },
	{ table: 'ExternalPublications', column: 'avatar' },
	{ table: 'Exports', column: 'url' },
	{ table: 'PubHeaderTheme', column: 'backgroundImage' },
];

/** TEXT columns that may contain embedded URLs (HTML, heroText, etc.) */
const FREETEXT_COLUMNS: Array<{ table: string; column: string }> = [
	{ table: 'Pubs', column: 'htmlTitle' },
	{ table: 'Pubs', column: 'htmlDescription' },
	{ table: 'Communities', column: 'heroText' },
	{ table: 'CustomScripts', column: 'content' },
];

// ─── JSONB columns ───────────────────────────────────────────────────────────

/** JSONB columns to rewrite by casting to text, replacing, and casting back. */
const JSONB_COLUMNS: Array<{ table: string; column: string }> = [
	{ table: 'Pubs', column: 'downloads' },
	{ table: 'Pages', column: 'layout' },
	{ table: 'Collections', column: 'layout' },
	{ table: 'Docs', column: 'content' },
	{ table: 'ThreadComments', column: 'content' },
	{ table: 'Releases', column: 'noteContent' },
	{ table: 'ReviewNews', column: 'reviewContent' },
	{ table: 'Submissions', column: 'abstract' },
	{ table: 'SubmissionWorkflows', column: 'instructionsText' },
	{ table: 'SubmissionWorkflows', column: 'acceptedText' },
	{ table: 'SubmissionWorkflows', column: 'declinedText' },
	{ table: 'SubmissionWorkflows', column: 'receivedEmailText' },
	{ table: 'SubmissionWorkflows', column: 'introText' },
	{ table: 'DraftCheckpoints', column: 'doc' },
	{ table: 'LandingPageFeatures', column: 'payload' },
	{ table: 'ActivityItems', column: 'payload' },
	{ table: 'WorkerTasks', column: 'input' },
	{ table: 'WorkerTasks', column: 'output' },
];

// ─── Scanning & rewriting ────────────────────────────────────────────────────

let grandTotal = 0;

async function tableExists(table: string): Promise<boolean> {
	const [rows] = (await sequelize.query(
		`SELECT 1 FROM information_schema.tables WHERE table_name = :table LIMIT 1`,
		{ replacements: { table } },
	)) as [Array<Record<string, unknown>>, unknown];
	return rows.length > 0;
}

async function rewriteTextColumn(table: string, column: string) {
	if (!(await tableExists(table))) {
		log(`  Skipping ${table}."${column}" — table does not exist`);
		return;
	}

	for (const { label, find, replace } of REWRITES) {
		// biome-ignore lint/performance/noAwaitInLoops: intentional sequential DB operations
		const [[{ count }]] = (await sequelize.query(
			`SELECT COUNT(*) AS count FROM "${table}" WHERE "${column}" LIKE :pattern`,
			{ replacements: { pattern: `%${find}%` } },
		)) as [Array<{ count: string }>, unknown];

		const n = Number(count);
		if (n === 0) continue;

		grandTotal += n;
		log(`  ${table}."${column}": ${n} rows contain ${label} URLs`);

		if (execute) {
			// biome-ignore lint/performance/noAwaitInLoops: intentional sequential DB operations
			await sequelize.query(
				`UPDATE "${table}"
				 SET "${column}" = REPLACE("${column}", :find, :replace)
				 WHERE "${column}" LIKE :pattern`,
				{ replacements: { find, replace, pattern: `%${find}%` } },
			);
			log(`    ✓ updated`);
		}
	}
}

async function rewriteJsonbColumn(table: string, column: string) {
	if (!(await tableExists(table))) {
		log(`  Skipping ${table}."${column}" — table does not exist`);
		return;
	}

	for (const { label, find, replace } of REWRITES) {
		// biome-ignore lint/performance/noAwaitInLoops: intentional sequential DB operations
		const [[{ count }]] = (await sequelize.query(
			`SELECT COUNT(*) AS count FROM "${table}"
			 WHERE "${column}" IS NOT NULL AND "${column}"::text LIKE :pattern`,
			{ replacements: { pattern: `%${find}%` } },
		)) as [Array<{ count: string }>, unknown];

		const n = Number(count);
		if (n === 0) continue;

		grandTotal += n;
		log(`  ${table}."${column}": ${n} rows contain ${label} URLs`);

		if (execute) {
			// biome-ignore lint/performance/noAwaitInLoops: intentional sequential DB operations
			await sequelize.query(
				`UPDATE "${table}"
				 SET "${column}" = REPLACE("${column}"::text, :find, :replace)::jsonb
				 WHERE "${column}" IS NOT NULL AND "${column}"::text LIKE :pattern`,
				{ replacements: { find, replace, pattern: `%${find}%` } },
			);
			log(`    ✓ updated`);
		}
	}
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
	if (!execute) {
		log('DRY RUN — pass --execute to actually rewrite URLs');
	}
	log('');

	log('Scanning TEXT columns (single-URL fields)...');
	for (const { table, column } of TEXT_COLUMNS) {
		// biome-ignore lint/performance/noAwaitInLoops: intentional sequential scanning
		await rewriteTextColumn(table, column);
	}
	log('');

	log('Scanning TEXT columns (freetext / HTML fields)...');
	for (const { table, column } of FREETEXT_COLUMNS) {
		// biome-ignore lint/performance/noAwaitInLoops: intentional sequential scanning
		await rewriteTextColumn(table, column);
	}
	log('');

	log('Scanning JSONB columns...');
	for (const { table, column } of JSONB_COLUMNS) {
		// biome-ignore lint/performance/noAwaitInLoops: intentional sequential scanning
		await rewriteJsonbColumn(table, column);
	}
	log('');

	if (grandTotal === 0) {
		log('No S3 URLs found — database is already clean.');
	} else if (!execute) {
		log(`DRY RUN complete — found ${grandTotal} rows to update (no changes made)`);
	} else {
		log(`Done — updated ${grandTotal} rows`);
	}

	process.exit(0);
}

main().catch((err) => {
	console.error('[rewriteS3Urls] Fatal error:', err);
	process.exit(1);
});
