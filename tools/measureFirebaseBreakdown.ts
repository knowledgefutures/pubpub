/**
 * Firebase Storage Breakdown Measurement Tool
 *
 * Samples drafts from Firebase to measure the proportion of storage used by
 * checkpoints vs. other data (changes, discussions, merges, etc.).
 *
 * This tool does NOT require a Postgres connection — it discovers draft paths
 * directly from Firebase using the REST API.
 *
 * Usage:
 *   pnpm run tools measureFirebaseBreakdown
 *   pnpm run tools measureFirebaseBreakdown --sampleSize=200
 *   pnpm run tools measureFirebaseBreakdown --draftPath=drafts/draft-<uuid>
 */

// Prevent Sequelize from crashing when DATABASE_URL points to an unreachable host
// (e.g. Docker-only hostname). This script doesn't use Postgres at all.
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('@db:')) {
	process.env.DATABASE_URL = 'postgres://localhost:5432/unused';
}

import firebaseAdmin from 'firebase-admin';

import { getFirebaseConfig } from 'utils/editor/firebaseConfig';

const {
	argv: { sampleSize: sampleSizeArg = 100, draftPath: specificDraftPath, prod },
} = require('yargs');

const sampleSize = Number(sampleSizeArg);

// Allow overriding to prod Firebase
const getDatabaseURL = (): string => {
	if (prod) {
		return 'https://pubpub-v6-prod.firebaseio.com';
	}
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

/**
 * Get the byte size of a Firebase path by fetching its JSON content.
 * Returns { bytes, keyCount } or null if the path doesn't exist.
 */
const getPathSize = async (
	path: string,
	retries = 3,
): Promise<{ bytes: number; keyCount: number } | null> => {
	const databaseURL = getDatabaseURL();
	const accessToken = await getAccessToken();
	const url = `${databaseURL}/${path}.json?access_token=${accessToken}`;

	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			// biome-ignore lint/performance/noAwaitInLoops: shhhhhh
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`HTTP ${response.status} ${response.statusText}`);
			}
			const text = await response.text();
			if (text === 'null') return null;
			const data = JSON.parse(text);
			const keyCount = data && typeof data === 'object' ? Object.keys(data).length : 1;
			// Use the raw JSON text length as the byte measurement —
			// this closely matches how Firebase RTDB stores/bills data
			return { bytes: Buffer.byteLength(text, 'utf-8'), keyCount };
		} catch (error: any) {
			if (attempt === retries) throw error;
			const delay = Math.min(1000 * 2 ** attempt, 10000);
			await new Promise((r) => setTimeout(r, delay));
		}
	}
	return null;
};

/**
 * Get shallow keys at a path (doesn't download content)
 */
const getShallowKeys = async (path: string, retries = 3): Promise<string[]> => {
	const databaseURL = getDatabaseURL();
	const accessToken = await getAccessToken();
	const url = `${databaseURL}/${path}.json?shallow=true&access_token=${accessToken}`;

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

// --- Types ---

interface DraftBreakdown {
	firebasePath: string;
	totalBytes: number;
	checkpointsBytes: number;
	checkpointMapBytes: number;
	deprecatedCheckpointBytes: number;
	changesBytes: number;
	mergesBytes: number;
	discussionsBytes: number;
	cursorsBytes: number;
	otherBytes: number;
	changeCount: number;
	checkpointCount: number;
}

// --- Main measurement ---

const measureDraft = async (firebasePath: string): Promise<DraftBreakdown | null> => {
	try {
		const childKeys = await getShallowKeys(firebasePath);
		if (childKeys.length === 0) return null;

		const breakdown: DraftBreakdown = {
			firebasePath,
			totalBytes: 0,
			checkpointsBytes: 0,
			checkpointMapBytes: 0,
			deprecatedCheckpointBytes: 0,
			changesBytes: 0,
			mergesBytes: 0,
			discussionsBytes: 0,
			cursorsBytes: 0,
			otherBytes: 0,
			changeCount: 0,
			checkpointCount: 0,
		};

		// Measure each child in parallel
		const measurements = await Promise.all(
			childKeys.map(async (child) => {
				const result = await getPathSize(`${firebasePath}/${child}`);
				return { child, result };
			}),
		);

		for (const { child, result } of measurements) {
			if (!result) continue;
			const { bytes, keyCount } = result;
			breakdown.totalBytes += bytes;

			switch (child) {
				case 'checkpoints':
					breakdown.checkpointsBytes = bytes;
					breakdown.checkpointCount = keyCount;
					break;
				case 'checkpointMap':
					breakdown.checkpointMapBytes = bytes;
					break;
				case 'checkpoint':
					breakdown.deprecatedCheckpointBytes = bytes;
					break;
				case 'changes':
					breakdown.changesBytes = bytes;
					breakdown.changeCount = keyCount;
					break;
				case 'merges':
					breakdown.mergesBytes = bytes;
					break;
				case 'discussions':
					breakdown.discussionsBytes = bytes;
					break;
				case 'cursors':
					breakdown.cursorsBytes = bytes;
					break;
				default:
					breakdown.otherBytes += bytes;
					break;
			}
		}

		return breakdown;
	} catch (err: any) {
		log(`  Error measuring ${firebasePath}: ${err.message}`);
		return null;
	}
};

const formatBytes = (bytes: number): string => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const formatPct = (part: number, total: number): string => {
	if (total === 0) return '0%';
	return `${((part / total) * 100).toFixed(1)}%`;
};

// Discover all draft paths from Firebase itself.
// Handles both drafts/draft-{id} and legacy pub-{id}/branch-{id} formats.
const discoverDraftPaths = async (): Promise<string[]> => {
	const paths: string[] = [];

	// Modern format: drafts/draft-{id}
	log('Discovering draft paths from Firebase...');
	const draftKeys = await getShallowKeys('drafts');
	for (const key of draftKeys) {
		paths.push(`drafts/${key}`);
	}
	log(`  Found ${draftKeys.length} paths under drafts/`);

	// Legacy format: pub-{id}/branch-{id}
	const rootKeys = await getShallowKeys('');
	const legacyPubKeys = rootKeys.filter((key) => key.startsWith('pub-'));
	if (legacyPubKeys.length > 0) {
		log(`  Found ${legacyPubKeys.length} legacy pub-* paths, scanning branches...`);
		const branchResults = await runWithConcurrency(
			legacyPubKeys.map((pubKey) => async () => {
				try {
					const children = await getShallowKeys(pubKey);
					return children
						.filter((c) => c.startsWith('branch-'))
						.map((c) => `${pubKey}/${c}`);
				} catch {
					return [];
				}
			}),
			10,
		);
		for (const branches of branchResults) {
			paths.push(...branches);
		}
		log(`  Found ${paths.length - draftKeys.length} legacy branch paths`);
	}

	log(`  Total draft paths: ${paths.length}`);
	return paths;
};

/**
 * Randomly sample n items from an array using Fisher-Yates partial shuffle
 */
const randomSample = <T>(arr: T[], n: number): T[] => {
	const copy = [...arr];
	const count = Math.min(n, copy.length);
	for (let i = 0; i < count; i++) {
		const j = i + Math.floor(Math.random() * (copy.length - i));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy.slice(0, count);
};

const main = async () => {
	log('Firebase Storage Breakdown Measurement');
	log(`Database: ${getDatabaseURL()}`);
	log('');

	let draftPaths: string[];
	let totalDraftCount: number;

	if (specificDraftPath) {
		draftPaths = [specificDraftPath as string];
		totalDraftCount = 1;
	} else {
		const allPaths = await discoverDraftPaths();
		totalDraftCount = allPaths.length;
		draftPaths = randomSample(allPaths, sampleSize);
		log(`Sampling ${draftPaths.length} of ${totalDraftCount} drafts...`);
	}

	log('');

	// Measure drafts with concurrency
	let completed = 0;
	const results = await runWithConcurrency(
		draftPaths.map((path) => async () => {
			const result = await measureDraft(path);
			completed++;
			if (completed % 25 === 0) {
				log(`  Progress: ${completed}/${draftPaths.length}`);
			}
			return result;
		}),
		10, // 10 concurrent measurements
	);

	const measured = results.filter((r): r is DraftBreakdown => r !== null);
	log(`\nSuccessfully measured ${measured.length} drafts\n`);

	if (measured.length === 0) {
		log('No data found.');
		process.exit(0);
	}

	// --- Aggregate stats ---
	const totals = measured.reduce(
		(acc, d) => ({
			totalBytes: acc.totalBytes + d.totalBytes,
			checkpointsBytes: acc.checkpointsBytes + d.checkpointsBytes,
			checkpointMapBytes: acc.checkpointMapBytes + d.checkpointMapBytes,
			deprecatedCheckpointBytes: acc.deprecatedCheckpointBytes + d.deprecatedCheckpointBytes,
			changesBytes: acc.changesBytes + d.changesBytes,
			mergesBytes: acc.mergesBytes + d.mergesBytes,
			discussionsBytes: acc.discussionsBytes + d.discussionsBytes,
			cursorsBytes: acc.cursorsBytes + d.cursorsBytes,
			otherBytes: acc.otherBytes + d.otherBytes,
			totalChanges: acc.totalChanges + d.changeCount,
			totalCheckpoints: acc.totalCheckpoints + d.checkpointCount,
		}),
		{
			totalBytes: 0,
			checkpointsBytes: 0,
			checkpointMapBytes: 0,
			deprecatedCheckpointBytes: 0,
			changesBytes: 0,
			mergesBytes: 0,
			discussionsBytes: 0,
			cursorsBytes: 0,
			otherBytes: 0,
			totalChanges: 0,
			totalCheckpoints: 0,
		},
	);

	const allCheckpointBytes =
		totals.checkpointsBytes + totals.checkpointMapBytes + totals.deprecatedCheckpointBytes;

	// --- Print results ---
	log('=== SAMPLE BREAKDOWN ===');
	log(`Drafts measured:       ${measured.length}`);
	log(`Total sampled size:    ${formatBytes(totals.totalBytes)}`);
	log('');
	log('--- By category ---');
	log(
		`checkpoints/       ${formatBytes(totals.checkpointsBytes).padStart(12)}  ${formatPct(totals.checkpointsBytes, totals.totalBytes).padStart(7)}  (${totals.totalCheckpoints} checkpoints)`,
	);
	log(
		`checkpoint (dep.)  ${formatBytes(totals.deprecatedCheckpointBytes).padStart(12)}  ${formatPct(totals.deprecatedCheckpointBytes, totals.totalBytes).padStart(7)}`,
	);
	log(
		`checkpointMap/     ${formatBytes(totals.checkpointMapBytes).padStart(12)}  ${formatPct(totals.checkpointMapBytes, totals.totalBytes).padStart(7)}`,
	);
	log(
		`changes/           ${formatBytes(totals.changesBytes).padStart(12)}  ${formatPct(totals.changesBytes, totals.totalBytes).padStart(7)}  (${totals.totalChanges} changes)`,
	);
	log(
		`merges/            ${formatBytes(totals.mergesBytes).padStart(12)}  ${formatPct(totals.mergesBytes, totals.totalBytes).padStart(7)}`,
	);
	log(
		`discussions/       ${formatBytes(totals.discussionsBytes).padStart(12)}  ${formatPct(totals.discussionsBytes, totals.totalBytes).padStart(7)}`,
	);
	log(
		`cursors/           ${formatBytes(totals.cursorsBytes).padStart(12)}  ${formatPct(totals.cursorsBytes, totals.totalBytes).padStart(7)}`,
	);
	log(
		`other              ${formatBytes(totals.otherBytes).padStart(12)}  ${formatPct(totals.otherBytes, totals.totalBytes).padStart(7)}`,
	);
	log('');
	log(
		`ALL CHECKPOINT DATA  ${formatBytes(allCheckpointBytes).padStart(10)}  ${formatPct(allCheckpointBytes, totals.totalBytes).padStart(7)}`,
	);
	log(
		`EVERYTHING ELSE      ${formatBytes(totals.totalBytes - allCheckpointBytes).padStart(10)}  ${formatPct(totals.totalBytes - allCheckpointBytes, totals.totalBytes).padStart(7)}`,
	);
	log('');

	// --- Extrapolation ---
	const avgBytesPerDraft = totals.totalBytes / measured.length;
	const avgCheckpointBytesPerDraft = allCheckpointBytes / measured.length;
	const avgNonCheckpointBytesPerDraft = avgBytesPerDraft - avgCheckpointBytesPerDraft;

	const estimatedTotalFirebase = avgBytesPerDraft * totalDraftCount;
	const estimatedCheckpointTotal = avgCheckpointBytesPerDraft * totalDraftCount;
	const estimatedNonCheckpointTotal = avgNonCheckpointBytesPerDraft * totalDraftCount;

	log('=== EXTRAPOLATION TO ALL DRAFTS ===');
	log(`Total drafts:                  ${totalDraftCount}`);
	log(`Avg bytes per draft:           ${formatBytes(avgBytesPerDraft)}`);
	log(`Avg checkpoint bytes/draft:    ${formatBytes(avgCheckpointBytesPerDraft)}`);
	log('');
	log(`Estimated total Firebase:      ${formatBytes(estimatedTotalFirebase)}`);
	log(
		`Estimated checkpoint data:     ${formatBytes(estimatedCheckpointTotal)}  (${formatPct(estimatedCheckpointTotal, estimatedTotalFirebase)})`,
	);
	log(
		`Estimated non-checkpoint data: ${formatBytes(estimatedNonCheckpointTotal)}  (${formatPct(estimatedNonCheckpointTotal, estimatedTotalFirebase)})`,
	);
	log('');
	log(`Reported Firebase size:        6 GB`);
	log(
		`If checkpoints removed:        ~${formatBytes(6 * 1024 * 1024 * 1024 * (1 - allCheckpointBytes / totals.totalBytes))}`,
	);
	log(`Free tier threshold:           1 GB`);
	log('');

	// --- Top 10 largest drafts in sample ---
	const sorted = [...measured].sort((a, b) => b.totalBytes - a.totalBytes);
	log('=== TOP 10 LARGEST DRAFTS IN SAMPLE ===');
	for (const d of sorted.slice(0, 10)) {
		const ckptBytes = d.checkpointsBytes + d.checkpointMapBytes + d.deprecatedCheckpointBytes;
		log(
			`  ${d.firebasePath.padEnd(50)} total=${formatBytes(d.totalBytes).padStart(10)}  ckpt=${formatBytes(ckptBytes).padStart(10)} (${formatPct(ckptBytes, d.totalBytes)})  changes=${d.changeCount}`,
		);
	}

	// --- Distribution of checkpoint ratios ---
	const ratios = measured
		.filter((d) => d.totalBytes > 0)
		.map((d) => {
			const ckptBytes =
				d.checkpointsBytes + d.checkpointMapBytes + d.deprecatedCheckpointBytes;
			return ckptBytes / d.totalBytes;
		})
		.sort((a, b) => a - b);

	if (ratios.length > 0) {
		log('');
		log('=== CHECKPOINT RATIO DISTRIBUTION ===');
		log(`  Min:    ${(ratios[0] * 100).toFixed(1)}%`);
		log(`  P25:    ${(ratios[Math.floor(ratios.length * 0.25)] * 100).toFixed(1)}%`);
		log(`  Median: ${(ratios[Math.floor(ratios.length * 0.5)] * 100).toFixed(1)}%`);
		log(`  P75:    ${(ratios[Math.floor(ratios.length * 0.75)] * 100).toFixed(1)}%`);
		log(`  Max:    ${(ratios[ratios.length - 1] * 100).toFixed(1)}%`);
	}

	log('\nDone.');
	process.exit(0);
};

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
