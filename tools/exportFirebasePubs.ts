/**
 * Firebase Pub Export Tool
 *
 * Queries Firebase for all pub-level keys (both modern drafts/draft-{id} and
 * legacy pub-{id}/branch-{id} paths) and writes each as an individual .json
 * file in a local output directory.
 *
 * This tool does NOT require a Postgres connection — it discovers paths
 * directly from Firebase using the REST API.
 *
 * Features:
 *   - Configurable concurrency for downloading 10k+ pubs
 *   - Streaming writes for large documents (avoids buffering entire JSON in memory)
 *   - Retry with exponential backoff on transient failures
 *   - Progress reporting with ETA
 *   - Resume support: skips already-downloaded files
 *
 * Usage:
 *   pnpm run tools exportFirebasePubs
 *   pnpm run tools exportFirebasePubs --prod
 *   pnpm run tools exportFirebasePubs --concurrency=20
 *   pnpm run tools exportFirebasePubs --outDir=./firebase-export-prod --prod
 *   pnpm run tools exportFirebasePubs --resume         # skip already-downloaded files
 *   pnpm run tools exportFirebasePubs --pathPrefix=drafts  # only export modern drafts
 */

// Prevent Sequelize from crashing when DATABASE_URL points to an unreachable host
// (e.g. Docker-only hostname). This script doesn't use Postgres at all.
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('@db:')) {
	process.env.DATABASE_URL = 'postgres://localhost:5432/unused';
}

import firebaseAdmin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

import { getFirebaseConfig } from 'utils/editor/firebaseConfig';

const {
	argv: {
		prod,
		concurrency: concurrencyArg = 15,
		outDir: outDirArg,
		resume: resumeFlag = false,
		pathPrefix: pathPrefixArg,
		verbose: verboseFlag,
		maxRetries: maxRetriesArg = 5,
	},
} = require('yargs');

const CONCURRENCY = Number(concurrencyArg);
const MAX_RETRIES = Number(maxRetriesArg);
const DEFAULT_OUT_DIR = prod ? './firebase-export-prod' : './firebase-export-dev';
const OUT_DIR = (outDirArg as string) || DEFAULT_OUT_DIR;

// --- Logging ---

// biome-ignore lint/suspicious/noConsole: CLI tool output
const log = (msg: string) => console.log(`[export] ${new Date().toISOString()} ${msg}`);
const verbose = (msg: string) => verboseFlag && log(msg);

// --- Firebase config ---

const getDatabaseURL = (): string => {
	if (prod) {
		return 'https://pubpub-v6-prod.firebaseio.com';
	}
	return getFirebaseConfig().databaseURL;
};

// --- Firebase Auth (cached token) ---

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

const getAccessToken = async (): Promise<string> => {
	const now = Date.now();
	if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60_000) {
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

const REST_TIMEOUT_MS = 120_000; // 2 min for large pubs

/**
 * Get shallow keys at a path (no content downloaded)
 */
const getShallowKeys = async (fbPath: string, retries = MAX_RETRIES): Promise<string[]> => {
	const databaseURL = getDatabaseURL();
	const accessToken = await getAccessToken();
	const url = `${databaseURL}/${fbPath}.json?shallow=true&access_token=${accessToken}`;

	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), REST_TIMEOUT_MS);

			try {
				// biome-ignore lint/performance/noAwaitInLoops: shhhhhh
				const response = await fetch(url, { signal: controller.signal });
				if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
				const data = await response.json();
				if (!data || typeof data !== 'object') return [];
				return Object.keys(data);
			} finally {
				clearTimeout(timeout);
			}
		} catch (error: any) {
			if (attempt === retries) throw error;
			const delay = Math.min(1000 * 2 ** attempt, 15_000);
			log(
				`  Shallow read ${fbPath} attempt ${attempt} failed: ${error.message}, retrying in ${delay}ms...`,
			);
			await new Promise((r) => setTimeout(r, delay));
		}
	}
	return [];
};

/**
 * Stream-download a Firebase path's JSON content directly to a file.
 * Uses streaming to avoid buffering multi-MB documents entirely in memory.
 */
const downloadPathToFile = async (
	fbPath: string,
	filePath: string,
	retries = MAX_RETRIES,
): Promise<{ bytes: number; skipped: boolean }> => {
	// Resume support: skip if file exists and is non-empty
	if (resumeFlag) {
		try {
			const stat = fs.statSync(filePath);
			if (stat.size > 0) {
				return { bytes: stat.size, skipped: true };
			}
		} catch {
			// File doesn't exist yet, proceed
		}
	}

	const databaseURL = getDatabaseURL();
	const accessToken = await getAccessToken();

	for (let attempt = 1; attempt <= retries; attempt++) {
		const url = `${databaseURL}/${fbPath}.json?access_token=${accessToken}`;
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), REST_TIMEOUT_MS);

		try {
			// biome-ignore lint/performance/noAwaitInLoops: shhhhhh
			const response = await fetch(url, { signal: controller.signal });
			if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
			if (!response.body) throw new Error('No response body');

			// Ensure parent directory exists
			const dir = path.dirname(filePath);
			fs.mkdirSync(dir, { recursive: true });

			// Write to a temp file first, then rename — atomic-ish write
			const tmpPath = `${filePath}.tmp`;

			// Use streaming pipeline: fetch body → file
			// The response.body from fetch is a ReadableStream (web), convert to Node stream
			const nodeStream = Readable.fromWeb(response.body as any);
			const writeStream = fs.createWriteStream(tmpPath, { highWaterMark: 256 * 1024 });

			let bytes = 0;
			nodeStream.on('data', (chunk: Buffer) => {
				bytes += chunk.length;
			});

			await pipeline(nodeStream, writeStream);

			// Check we didn't just download "null"
			if (bytes <= 4) {
				const content = fs.readFileSync(tmpPath, 'utf-8').trim();
				if (content === 'null') {
					fs.unlinkSync(tmpPath);
					return { bytes: 0, skipped: false };
				}
			}

			// Atomic rename
			fs.renameSync(tmpPath, filePath);
			return { bytes, skipped: false };
		} catch (error: any) {
			// Clean up temp file on failure
			try {
				fs.unlinkSync(`${filePath}.tmp`);
			} catch {
				// ignore
			}

			if (attempt === retries) throw error;
			const delay = Math.min(1000 * 2 ** attempt, 30_000);
			log(
				`  Download ${fbPath} attempt ${attempt} failed: ${error.message}, retrying in ${delay}ms...`,
			);
			await new Promise((r) => setTimeout(r, delay));
		} finally {
			clearTimeout(timeout);
		}
	}

	return { bytes: 0, skipped: false };
};

// --- Concurrency helper ---

const runWithConcurrency = async <T>(
	tasks: (() => Promise<T>)[],
	concurrency: number,
	onProgress?: (completed: number, total: number) => void,
): Promise<T[]> => {
	const results: T[] = [];
	let index = 0;
	let completed = 0;

	const worker = async (): Promise<void> => {
		while (index < tasks.length) {
			const currentIndex = index++;
			// biome-ignore lint/performance/noAwaitInLoops: worker loop
			results[currentIndex] = await tasks[currentIndex]();
			completed++;
			if (onProgress) onProgress(completed, tasks.length);
		}
	};

	await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()));
	return results;
};

// --- Path discovery ---

/**
 * Discover all pub-level paths from Firebase.
 * Modern: drafts/draft-{id}
 * Legacy: pub-{id}/branch-{id}
 */
const discoverPubPaths = async (): Promise<string[]> => {
	const paths: string[] = [];

	if (!pathPrefixArg || pathPrefixArg === 'drafts') {
		// Modern format: drafts/draft-{id}
		log('Discovering modern draft paths (drafts/draft-*)...');
		const draftKeys = await getShallowKeys('drafts');
		for (const key of draftKeys) {
			paths.push(`drafts/${key}`);
		}
		log(`  Found ${draftKeys.length} paths under drafts/`);
	}

	if (!pathPrefixArg || pathPrefixArg === 'legacy' || pathPrefixArg === 'pubs') {
		// Legacy format: pub-{id}/branch-{id}
		log('Discovering legacy pub paths (pub-*/branch-*)...');
		const rootKeys = await getShallowKeys('');
		const legacyPubKeys = rootKeys.filter((key) => key.startsWith('pub-'));

		if (legacyPubKeys.length > 0) {
			log(`  Found ${legacyPubKeys.length} legacy pub-* roots, scanning branches...`);
			let legacyBranchCount = 0;

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
				CONCURRENCY,
			);

			for (const branches of branchResults) {
				paths.push(...branches);
				legacyBranchCount += branches.length;
			}
			log(`  Found ${legacyBranchCount} legacy branch paths`);
		}
	}

	log(`Total paths to export: ${paths.length}`);
	return paths;
};

// --- Formatting helpers ---

const formatBytes = (bytes: number): string => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const formatDuration = (ms: number): string => {
	if (ms < 1000) return `${ms}ms`;
	const seconds = Math.floor(ms / 1000);
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	const secs = seconds % 60;
	if (minutes < 60) return `${minutes}m ${secs}s`;
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	return `${hours}h ${mins}m`;
};

// --- Main ---

const main = async () => {
	log('Firebase Pub Export Tool');
	log(`Database:    ${getDatabaseURL()}`);
	log(`Output dir:  ${path.resolve(OUT_DIR)}`);
	log(`Concurrency: ${CONCURRENCY}`);
	log(`Resume:      ${resumeFlag ? 'yes (skipping existing files)' : 'no'}`);
	log('');

	// Create output directories
	const draftsDir = path.join(OUT_DIR, 'drafts');
	const legacyDir = path.join(OUT_DIR, 'legacy');
	fs.mkdirSync(draftsDir, { recursive: true });
	fs.mkdirSync(legacyDir, { recursive: true });

	// Discover all paths
	const allPaths = await discoverPubPaths();

	if (allPaths.length === 0) {
		log('No paths found. Exiting.');
		process.exit(0);
	}

	// Build download tasks
	const startTime = Date.now();
	let totalBytes = 0;
	let downloadedCount = 0;
	let skippedCount = 0;
	let emptyCount = 0;
	let errorCount = 0;
	const errors: { path: string; error: string }[] = [];

	const tasks = allPaths.map((fbPath) => async () => {
		// Determine output file path
		// drafts/draft-abc-123 → drafts/draft-abc-123.json
		// pub-abc/branch-def  → legacy/pub-abc__branch-def.json
		let relPath: string;
		if (fbPath.startsWith('drafts/')) {
			const draftId = fbPath.replace('drafts/', '');
			relPath = path.join('drafts', `${draftId}.json`);
		} else {
			// pub-xxx/branch-yyy → pub-xxx__branch-yyy.json
			const safeName = fbPath.replace(/\//g, '__');
			relPath = path.join('legacy', `${safeName}.json`);
		}
		const filePath = path.join(OUT_DIR, relPath);

		try {
			const { bytes, skipped } = await downloadPathToFile(fbPath, filePath);
			if (skipped) {
				skippedCount++;
			} else if (bytes === 0) {
				emptyCount++;
			} else {
				downloadedCount++;
				totalBytes += bytes;
			}
			return { fbPath, bytes, skipped, error: null };
		} catch (error: any) {
			errorCount++;
			errors.push({ path: fbPath, error: error.message });
			verbose(`  FAILED ${fbPath}: ${error.message}`);
			return { fbPath, bytes: 0, skipped: false, error: error.message };
		}
	});

	log(`Starting download of ${allPaths.length} paths...\n`);

	let lastProgressLog = 0;
	await runWithConcurrency(tasks, CONCURRENCY, (completed, total) => {
		const now = Date.now();
		// Log progress every 5 seconds or every 100 items
		if (now - lastProgressLog > 5_000 || completed % 100 === 0 || completed === total) {
			lastProgressLog = now;
			const elapsed = now - startTime;
			const rate = completed / (elapsed / 1000);
			const remaining = total - completed;
			const eta = rate > 0 ? remaining / rate : 0;
			log(
				`  Progress: ${completed}/${total} (${((completed / total) * 100).toFixed(1)}%) ` +
					`| ${formatBytes(totalBytes)} downloaded ` +
					`| ${rate.toFixed(1)}/s ` +
					`| ETA: ${formatDuration(eta * 1000)}`,
			);
		}
	});

	// --- Summary ---
	const elapsed = Date.now() - startTime;

	log('');
	log('=== EXPORT COMPLETE ===');
	log(`Duration:         ${formatDuration(elapsed)}`);
	log(`Total paths:      ${allPaths.length}`);
	log(`Downloaded:       ${downloadedCount} (${formatBytes(totalBytes)})`);
	log(`Skipped (resume): ${skippedCount}`);
	log(`Empty/null:       ${emptyCount}`);
	log(`Errors:           ${errorCount}`);
	log(`Output:           ${path.resolve(OUT_DIR)}`);

	if (errors.length > 0) {
		log('');
		log('=== ERRORS ===');
		// Write errors to a file for easy review
		const errorLogPath = path.join(OUT_DIR, 'errors.json');
		fs.writeFileSync(errorLogPath, JSON.stringify(errors, null, 2));
		log(`Error details written to ${errorLogPath}`);
		for (const err of errors.slice(0, 20)) {
			log(`  ${err.path}: ${err.error}`);
		}
		if (errors.length > 20) {
			log(`  ... and ${errors.length - 20} more (see errors.json)`);
		}
	}

	// Write a manifest of all exported paths
	const manifest = {
		exportDate: new Date().toISOString(),
		databaseURL: getDatabaseURL(),
		totalPaths: allPaths.length,
		downloaded: downloadedCount,
		skipped: skippedCount,
		empty: emptyCount,
		errors: errorCount,
		totalBytes,
		durationMs: elapsed,
		paths: allPaths,
	};
	const manifestPath = path.join(OUT_DIR, 'manifest.json');
	fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
	log(`Manifest written to ${manifestPath}`);

	log('\nDone.');
	process.exit(errorCount > 0 ? 1 : 0);
};

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
