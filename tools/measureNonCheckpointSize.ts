/**
 * Firebase Non-Checkpoint Size Measurement
 *
 * Downloads every non-checkpoint child from every draft in Firebase and writes
 * them to a local temp file. The resulting file size is an exact measure of
 * what Firebase would contain if all checkpoint data were removed.
 *
 * This does NOT modify Firebase in any way — it only reads.
 *
 * Usage:
 *   pnpm run tools measureNonCheckpointSize                # dev Firebase
 *   pnpm run tools measureNonCheckpointSize --prod         # prod Firebase
 *   pnpm run tools measureNonCheckpointSize --prod --concurrency=20
 */

// Prevent Sequelize from crashing when DATABASE_URL points to an unreachable host
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('@db:')) {
	process.env.DATABASE_URL = 'postgres://localhost:5432/unused';
}

import firebaseAdmin from 'firebase-admin';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { getFirebaseConfig } from 'utils/editor/firebaseConfig';

const {
	argv: { prod, concurrency: concurrencyArg = 50 },
} = require('yargs');

const CONCURRENCY = Number(concurrencyArg);

// Children to skip — these are checkpoint data
const CHECKPOINT_CHILDREN = new Set(['checkpoints', 'checkpointMap', 'checkpoint']);

const getDatabaseURL = (): string => {
	if (prod) return 'https://pubpub-v6-prod.firebaseio.com';
	return getFirebaseConfig().databaseURL;
};

const log = (msg: string) => console.log(`[measure] ${new Date().toISOString()} ${msg}`);

// --- Firebase Auth ---

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

const getAccessToken = async (): Promise<string> => {
	const now = Date.now();
	if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60000) {
		return cachedAccessToken.token;
	}
	const credential = firebaseAdmin.credential.cert(
		JSON.parse(
			Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 as string, 'base64').toString(),
		),
	);
	const tokenResult = await credential.getAccessToken();
	cachedAccessToken = {
		token: tokenResult.access_token,
		expiresAt: now + (tokenResult.expires_in ?? 3600) * 1000,
	};
	return cachedAccessToken.token;
};

// --- Firebase REST helpers ---

const fetchJson = async (urlPath: string, retries = 3): Promise<string | null> => {
	const databaseURL = getDatabaseURL();
	const accessToken = await getAccessToken();
	const url = `${databaseURL}/${urlPath}.json?access_token=${accessToken}`;

	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			// biome-ignore lint/performance/noAwaitInLoops: shhhhhh
			const response = await fetch(url);
			if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
			const text = await response.text();
			if (text === 'null') return null;
			return text;
		} catch (error: any) {
			if (attempt === retries) throw error;
			const delay = Math.min(1000 * 2 ** attempt, 10000);
			await new Promise((r) => setTimeout(r, delay));
		}
	}
	return null;
};

const getShallowKeys = async (urlPath: string, retries = 3): Promise<string[]> => {
	const databaseURL = getDatabaseURL();
	const accessToken = await getAccessToken();
	const url = `${databaseURL}/${urlPath}.json?shallow=true&access_token=${accessToken}`;

	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			// biome-ignore lint/performance/noAwaitInLoops: shhhhhh
			const response = await fetch(url);
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const data = await response.json();
			if (!data || typeof data !== 'object') return [];
			return Object.keys(data);
		} catch (error: any) {
			if (attempt === retries) throw error;
			const delay = Math.min(1000 * 2 ** attempt, 10000);
			await new Promise((r) => setTimeout(r, delay));
		}
	}
	return [];
};

// --- Concurrency helper ---

const runWithConcurrency = async <T>(
	tasks: (() => Promise<T>)[],
	concurrency: number,
): Promise<T[]> => {
	const results: T[] = [];
	let index = 0;
	const worker = async (): Promise<void> => {
		while (index < tasks.length) {
			const currentIndex = index++;
			// biome-ignore lint/performance/noAwaitInLoops: shhhhhh
			results[currentIndex] = await tasks[currentIndex]();
		}
	};
	await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()));
	return results;
};

const formatBytes = (bytes: number): string => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

// --- Main ---

const main = async () => {
	const databaseURL = getDatabaseURL();
	log(`Firebase Non-Checkpoint Size Measurement`);
	log(`Database: ${databaseURL}`);
	log(`Concurrency: ${CONCURRENCY}`);
	log('');

	// Output file
	const outFile = path.join(os.tmpdir(), `firebase-non-checkpoint-${Date.now()}.jsonl`);
	const writeStream = fs.createWriteStream(outFile);
	log(`Writing non-checkpoint data to: ${outFile}`);
	log('');

	// --- Discover all draft paths ---
	log('Discovering draft paths...');

	// Modern: drafts/draft-{id}
	const draftKeys = await getShallowKeys('drafts');
	const modernPaths = draftKeys.map((k) => `drafts/${k}`);
	log(`  ${modernPaths.length} paths under drafts/`);

	// Legacy: pub-{id}/branch-{id}
	const rootKeys = await getShallowKeys('');
	const legacyPubKeys = rootKeys.filter((k) => k.startsWith('pub-'));
	log(`  ${legacyPubKeys.length} legacy pub-* roots, scanning branches...`);

	const legacyBranches = await runWithConcurrency(
		legacyPubKeys.map((pubKey) => async () => {
			try {
				const children = await getShallowKeys(pubKey);
				return children.filter((c) => c.startsWith('branch-')).map((c) => `${pubKey}/${c}`);
			} catch {
				return [];
			}
		}),
		10,
	);
	const legacyPaths = legacyBranches.flat();
	log(`  ${legacyPaths.length} legacy branch paths`);

	const allPaths = [...modernPaths, ...legacyPaths];
	log(`  Total: ${allPaths.length} draft paths`);
	log('');

	// --- Process each draft: download non-checkpoint children, write to file ---
	let processed = 0;
	let errors = 0;
	let totalNonCheckpointBytes = 0;
	let totalDraftsWithData = 0;

	const processDraft = async (draftPath: string): Promise<void> => {
		try {
			const childKeys = await getShallowKeys(draftPath);
			const nonCheckpointKeys = childKeys.filter((k) => !CHECKPOINT_CHILDREN.has(k));

			if (nonCheckpointKeys.length === 0) {
				processed++;
				return;
			}

			// Download each non-checkpoint child and write to the file
			for (const childKey of nonCheckpointKeys) {
				// biome-ignore lint/performance/noAwaitInLoops: shhhhhh
				const json = await fetchJson(`${draftPath}/${childKey}`);
				if (json) {
					const line = `${draftPath}/${childKey}\t${json}\n`;
					const _lineBytes = Buffer.byteLength(line, 'utf-8');
					totalNonCheckpointBytes += Buffer.byteLength(json, 'utf-8');
					writeStream.write(line);
				}
			}

			totalDraftsWithData++;
		} catch (_err: any) {
			errors++;
		}

		processed++;
		if (processed % 500 === 0) {
			log(
				`  Progress: ${processed}/${allPaths.length} (${formatBytes(totalNonCheckpointBytes)} so far, ${errors} errors)`,
			);
		}
	};

	await runWithConcurrency(
		allPaths.map((p) => () => processDraft(p)),
		CONCURRENCY,
	);

	// Close the write stream
	await new Promise<void>((resolve) => writeStream.end(resolve));

	// Get actual file size on disk
	const fileStat = fs.statSync(outFile);

	log('');
	log('=== RESULTS ===');
	log(`Drafts scanned:             ${allPaths.length}`);
	log(`Drafts with data:           ${totalDraftsWithData}`);
	log(`Errors:                     ${errors}`);
	log('');
	log(`Non-checkpoint JSON bytes:  ${formatBytes(totalNonCheckpointBytes)}`);
	log(
		`Output file size on disk:   ${formatBytes(fileStat.size)} (includes path keys + tabs + newlines)`,
	);
	log(`Output file:                ${outFile}`);
	log('');
	log('--- Projection ---');
	log(`Reported Firebase total:    6 GB`);
	log(`Non-checkpoint data:        ${formatBytes(totalNonCheckpointBytes)}`);
	log(
		`Checkpoint data (inferred): ${formatBytes(6 * 1024 * 1024 * 1024 - totalNonCheckpointBytes)}`,
	);
	log(
		`Checkpoint % of total:      ${(((6 * 1024 * 1024 * 1024 - totalNonCheckpointBytes) / (6 * 1024 * 1024 * 1024)) * 100).toFixed(1)}%`,
	);
	log(`Free tier threshold:        1 GB`);
	log(
		`Under free tier?            ${totalNonCheckpointBytes < 1024 * 1024 * 1024 ? 'YES' : 'NO'}`,
	);
	log('');
	log('Done. You can inspect or delete the output file at:');
	log(`  ${outFile}`);

	process.exit(0);
};

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
