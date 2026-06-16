/**
 * Cold Storage Tool
 *
 * Moves inactive drafts from Firebase to Postgres by:
 * 1. Finding drafts not edited within a threshold (default: 30 days)
 * 2. Building a checkpoint from the current Firebase state (checkpoint + changes)
 * 3. Storing that checkpoint in the DraftCheckpoints Postgres table
 * 4. Wiping all data from the Firebase path (changes, checkpoints, merges, etc.)
 *
 * When a user next opens a cold-stored draft, the server loads the checkpoint
 * from Postgres and the client connects to an empty Firebase ref — ready for
 * new edits. A future run of this tool will re-checkpoint those new edits.
 *
 * This tool is safe to run repeatedly. Drafts already cold-stored (with an
 * empty Firebase ref) are skipped.
 *
 * Usage:
 *   pnpm run tools coldStorage                         # Dry run, all stale drafts
 *   pnpm run tools coldStorage --execute               # Actually migrate + wipe
 *   pnpm run tools coldStorage --daysOld=60            # Custom threshold
 *   pnpm run tools coldStorage --pubId=<uuid>          # Single pub
 *   (Prod/dev is determined by env vars: DATABASE_URL, FIREBASE_SERVICE_ACCOUNT_BASE64)
 */

import firebaseAdmin from 'firebase-admin';
import { uncompressSelectionJSON } from 'prosemirror-compress-pubpub';
import { Op, QueryTypes } from 'sequelize';

import { editorSchema, getFirebaseDoc, getStepsInChangeRange } from 'components/Editor';
import { getDraftCheckpoint } from 'server/draftCheckpoint/queries';
import { Draft, DraftCheckpoint, Pub, Release } from 'server/models';
import { sequelize } from 'server/sequelize';
import { getDatabaseRef, getPubDraftDoc } from 'server/utils/firebaseAdmin';
import { getFirebaseConfig } from 'utils/editor/firebaseConfig';

const {
	argv: {
		execute,
		pubId: specificPubId,
		daysOld: daysOldArg = 30,
		batchSize: batchSizeArg = 100,
		concurrency: concurrencyArg = 10,
		verbose: verboseFlag,
	},
} = require('yargs');

const isDryRun = !execute;
const DAYS_OLD = Number(daysOldArg);
const BATCH_SIZE = Number(batchSizeArg);
const CONCURRENCY = Number(concurrencyArg);

// biome-ignore lint/suspicious/noConsole: CLI tool output
const log = (msg: string) => console.log(`[cold-storage] ${new Date().toISOString()} ${msg}`);
const verbose = (msg: string) => verboseFlag && log(msg);

// --- Firebase REST helpers (avoid SDK WebSocket throttling) ---

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

const REST_TIMEOUT_MS = 60_000;
const REST_MAX_RETRIES = 5;

/**
 * General-purpose Firebase REST API helper.
 * Each call is an independent HTTP request — no shared WebSocket.
 */
const firebaseRest = async <T = any>(
	method: 'GET' | 'PUT' | 'PATCH' | 'DELETE',
	path: string,
	body?: any,
	queryParams?: Record<string, string>,
): Promise<T> => {
	const databaseURL = getFirebaseConfig().databaseURL;

	for (let attempt = 1; attempt <= REST_MAX_RETRIES; attempt++) {
		// biome-ignore lint/performance/noAwaitInLoops: retry loop
		const accessToken = await getAccessToken();
		const params = new URLSearchParams({ access_token: accessToken, ...queryParams });
		const url = `${databaseURL}/${path}.json?${params}`;

		try {
			const options: RequestInit = {
				method,
				signal: AbortSignal.timeout(REST_TIMEOUT_MS),
			};
			if (body !== undefined) {
				options.headers = { 'Content-Type': 'application/json' };
				options.body = JSON.stringify(body);
			}
			const response = await fetch(url, options);
			if (!response.ok) {
				const text = await response.text();
				throw new Error(`Firebase REST ${method} ${response.status}: ${text}`);
			}
			if (method === 'DELETE') return null as T;
			return (await response.json()) as T;
		} catch (error: any) {
			// Don't retry deterministic errors like WRITE_TOO_BIG
			const errMsg = error?.message || String(error);
			if (
				errMsg.includes('Data to write exceeds') ||
				errMsg.includes('WRITE_TOO_BIG') ||
				errMsg.includes('write_too_big')
			) {
				throw error;
			}
			if (attempt === REST_MAX_RETRIES) throw error;
			const delay = Math.min(2000 * 2 ** attempt, 30_000);
			log(
				`  [rest] ${method} ${path}: attempt ${attempt} failed, retrying in ${delay / 1000}s (${errMsg})`,
			);
			await new Promise((r) => setTimeout(r, delay));
		}
	}
	throw new Error('unreachable');
};

/**
 * List child keys at a Firebase path using REST API with ?shallow=true.
 * Never downloads the actual content, so safe for huge nodes.
 */
const getShallowKeys = async (ref: any): Promise<string[]> => {
	const refPath = ref.toString().replace(/^https:\/\/[^/]+\//, '');
	const data = await firebaseRest<Record<string, true> | null>('GET', refPath, undefined, {
		shallow: 'true',
	});
	if (!data || typeof data !== 'object') return [];
	return Object.keys(data);
};

/**
 * Recursively delete a Firebase path via REST, handling WRITE_TOO_BIG errors
 * by listing children shallowly and batch-deleting with multi-path PATCH.
 */
const DELETE_BATCH_SIZE = 2500;

const deleteFirebasePath = async (path: string): Promise<void> => {
	try {
		await firebaseRest('DELETE', path);
	} catch (error: any) {
		const msg = error?.message || String(error);
		if (
			!msg.includes('Data to write exceeds') &&
			!msg.includes('WRITE_TOO_BIG') &&
			!msg.includes('write_too_big')
		)
			throw error;

		verbose(`  ${path} too large, deleting in batches`);
		const childKeys = await firebaseRest<Record<string, true> | null>('GET', path, undefined, {
			shallow: 'true',
		});
		if (!childKeys || typeof childKeys !== 'object') return;
		const keys = Object.keys(childKeys);

		for (let i = 0; i < keys.length; i += DELETE_BATCH_SIZE) {
			const batch = keys.slice(i, i + DELETE_BATCH_SIZE);
			const updates: Record<string, null> = {};
			for (const key of batch) {
				updates[key] = null;
			}
			try {
				// biome-ignore lint/performance/noAwaitInLoops: batched deletion
				await firebaseRest('PATCH', path, updates);
			} catch (batchErr: any) {
				const batchMsg = batchErr?.message || String(batchErr);
				if (
					batchMsg.includes('Data to write exceeds') ||
					batchMsg.includes('WRITE_TOO_BIG') ||
					batchMsg.includes('write_too_big')
				) {
					for (const key of batch) {
						// biome-ignore lint/performance/noAwaitInLoops: sequential fallback
						await deleteFirebasePath(`${path}/${key}`);
					}
				} else {
					throw batchErr;
				}
			}
		}

		// Delete the now-empty parent
		await firebaseRest('DELETE', path);
	}
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
			// biome-ignore lint/performance/noAwaitInLoops: worker pool pattern
			results[currentIndex] = await tasks[currentIndex]();
		}
	};
	await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()));
	return results;
};

// --- Stats ---

interface ColdStorageStats {
	draftsScanned: number;
	draftsAlreadyCold: number;
	draftsEmpty: number;
	draftsFrozen: number;
	draftsSkippedError: number;
	bytesFreed: number;
}

const stats: ColdStorageStats = {
	draftsScanned: 0,
	draftsAlreadyCold: 0,
	draftsEmpty: 0,
	draftsFrozen: 0,
	draftsSkippedError: 0,
	bytesFreed: 0,
};

const formatBytes = (bytes: number): string => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

// --- Core logic ---

/**
 * Freeze a single draft: build checkpoint from Firebase, store in Postgres, wipe Firebase.
 *
 * Steps:
 * 1. Build the current doc from Firebase (checkpoint + changes)
 * 2. Collect Firebase discussions and fast-forward them to the current key
 * 3. Compute cumulative StepMaps from latest release to current key
 * 4. Store checkpoint, discussions, and stepMaps in Postgres
 * 5. Update latestKeyAt on the Draft
 * 6. Wipe all Firebase data for this draft
 */
const freezeDraft = async (draft: Draft, pubId: string): Promise<void> => {
	const { id: draftId, firebasePath } = draft;
	const prefix = `[${draftId.slice(0, 8)}]`;

	if (!firebasePath) {
		verbose(`${prefix} No firebase path, skipping`);
		stats.draftsAlreadyCold++;
		return;
	}

	try {
		const draftRef = getDatabaseRef(firebasePath);

		// Check if Firebase has any data at all
		const topLevelKeys = await getShallowKeys(draftRef);
		if (topLevelKeys.length === 0) {
			verbose(`${prefix} Firebase path empty, marking as already cold`);
			stats.draftsAlreadyCold++;
			return;
		}

		// Build the current doc using PG-first logic (handles previously cold-stored drafts
		// where Firebase only has changes since the last thaw, not the full history).
		const draftDocInfo = await getPubDraftDoc(pubId);
		const currentKey = draftDocInfo.mostRecentRemoteKey;
		const currentTimestamp = draftDocInfo.latestTimestamp;

		if (currentKey < 0) {
			verbose(`${prefix} No history found (empty doc, no changes)`);
			stats.draftsEmpty++;
			return;
		}

		const docJson = draftDocInfo.doc;
		const docSize = JSON.stringify(docJson).length;

		verbose(`${prefix} Doc at key ${currentKey}, size ${formatBytes(docSize)}`);

		// Collect and fast-forward Firebase discussions (via REST to avoid WebSocket throttling)
		let frozenDiscussions: Record<string, any> | null = null;
		const rawDiscussions = await firebaseRest<Record<string, any> | null>(
			'GET',
			`${firebasePath}/discussions`,
		);
		if (rawDiscussions && typeof rawDiscussions === 'object') {
			// Fast-forward outdated discussions to currentKey using step maps.
			// Discussions whose currentKey matches are already at the latest position.
			const outdatedIds = Object.entries(rawDiscussions).filter(
				([_, d]: [string, any]) =>
					d && typeof d.currentKey === 'number' && d.currentKey < currentKey,
			);

			if (outdatedIds.length > 0) {
				// Only fetch steps that are actually available in Firebase.
				// After a previous cold storage, early changes are gone — the PG
				// checkpoint key is the earliest we can fetch from.
				const existingCheckpoint = await getDraftCheckpoint(draftId);
				const earliestFirebaseKey = existingCheckpoint ? existingCheckpoint.historyKey : 0;
				const mostOutdatedKey = Math.max(
					earliestFirebaseKey,
					Math.min(...outdatedIds.map(([_, d]: [string, any]) => d.currentKey)),
				);
				verbose(
					`${prefix} Fast-forwarding ${outdatedIds.length} discussions from key ${mostOutdatedKey}`,
				);

				try {
					const stepsByChange = await getStepsInChangeRange(
						draftRef,
						editorSchema,
						mostOutdatedKey + 1,
						currentKey,
					);
					const allSteps = stepsByChange.reduce((a, b) => [...a, ...b], []);

					for (const [id, discussion] of outdatedIds) {
						const disc = discussion as any;
						if (disc.selection) {
							const sel =
								disc.selection.a !== undefined
									? uncompressSelectionJSON(disc.selection)
									: disc.selection;

							let from = Math.min(sel.anchor, sel.head);
							let to = Math.max(sel.anchor, sel.head);
							const stepsToApply = allSteps.slice(disc.currentKey - mostOutdatedKey);

							for (const step of stepsToApply) {
								const map = step.getMap();
								from = map.map(from, 1);
								to = map.map(to, -1);
							}

							if (from < to && from > 0) {
								rawDiscussions[id] = {
									...disc,
									selection: { type: 'text', a: from, h: to },
									currentKey,
								};
							} else {
								rawDiscussions[id] = { ...disc, selection: null, currentKey };
							}
						} else {
							rawDiscussions[id] = { ...disc, currentKey };
						}
					}
				} catch (err: any) {
					verbose(
						`${prefix} Warning: could not fast-forward discussions: ${err.message}`,
					);
				}
			}

			frozenDiscussions = rawDiscussions;
			verbose(`${prefix} Freezing ${Object.keys(rawDiscussions).length} discussions`);
		}

		// Compute stepMaps from latest release to this checkpoint for discussion anchor mapping.
		// If we already have stored stepMaps (from a previous cold storage), compose them
		// with the new Firebase-only changes rather than trying to fetch wiped history.
		let stepMaps: number[][] | null = null;
		let stepMapToKey: number | null = null;
		const existingPgCheckpoint = await getDraftCheckpoint(draftId);
		const latestRelease = await Release.findOne({
			where: { pubId },
			attributes: ['historyKey'],
			order: [['historyKey', 'DESC']],
		});

		if (latestRelease && latestRelease.historyKey < currentKey) {
			try {
				// Start from existing stored stepMaps if available (covers wiped range)
				const existingMaps = existingPgCheckpoint?.stepMaps ?? [];
				const existingToKey = existingPgCheckpoint?.stepMapToKey ?? null;

				// Determine what range of new Firebase steps we need
				const newStepsStartKey =
					existingToKey != null ? existingToKey + 1 : latestRelease.historyKey + 1;

				let newMaps: number[][] = [];
				if (newStepsStartKey <= currentKey) {
					const stepsByChange = await getStepsInChangeRange(
						draftRef,
						editorSchema,
						newStepsStartKey,
						currentKey,
					);
					const allSteps = stepsByChange.reduce((a, b) => [...a, ...b], []);
					newMaps = allSteps.map((step) =>
						Array.from((step.getMap() as any).ranges as number[]),
					);
				}

				stepMaps = [...existingMaps, ...newMaps];
				stepMapToKey = currentKey;
				verbose(
					`${prefix} Stored ${stepMaps.length} stepMaps (${existingMaps.length} existing + ${newMaps.length} new, up to key ${currentKey}) from release key ${latestRelease.historyKey}`,
				);
			} catch (err: any) {
				verbose(`${prefix} Warning: could not compute stepMaps: ${err.message}`);
			}
		}

		if (isDryRun) {
			log(
				`${prefix} Would freeze: key=${currentKey} docSize=${formatBytes(docSize)} discussions=${frozenDiscussions ? Object.keys(frozenDiscussions).length : 0} stepMaps=${stepMaps?.length ?? 0} stepMapToKey=${stepMapToKey}`,
			);
			stats.draftsFrozen++;
			stats.bytesFreed += docSize;
			return;
		}

		// Store checkpoint in Postgres (upsert)
		await sequelize.transaction(async (txn) => {
			const existing = await DraftCheckpoint.findOne({
				where: { draftId },
				transaction: txn,
			});

			if (existing) {
				await existing.update(
					{
						historyKey: currentKey,
						doc: docJson,
						timestamp: currentTimestamp,
						discussions: frozenDiscussions,
						stepMaps,
						stepMapToKey,
					},
					{ transaction: txn },
				);
			} else {
				await DraftCheckpoint.create(
					{
						draftId,
						historyKey: currentKey,
						doc: docJson,
						timestamp: currentTimestamp,
						discussions: frozenDiscussions,
						stepMaps,
						stepMapToKey,
					},
					{ transaction: txn },
				);
			}

			// Update latestKeyAt on the Draft
			if (currentTimestamp) {
				await Draft.update(
					{ latestKeyAt: new Date(currentTimestamp) },
					{ where: { id: draftId }, transaction: txn },
				);
			}
		});

		// Wipe Firebase data
		await deleteFirebasePath(firebasePath);

		verbose(`${prefix} Frozen successfully`);
		stats.draftsFrozen++;
	} catch (err: any) {
		log(`${prefix} Error: ${err.message}`);
		stats.draftsSkippedError++;
	}

	stats.draftsScanned++;
};

// --- Main ---

const main = async () => {
	log('Firebase Cold Storage Tool');
	log(`Mode: ${isDryRun ? 'DRY RUN' : 'EXECUTE'}`);
	log(`Threshold: ${DAYS_OLD} days old`);
	log(`Batch size: ${BATCH_SIZE}`);
	log(`Concurrency: ${CONCURRENCY}`);
	log('');

	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - DAYS_OLD);
	log(`Cutoff date: ${cutoffDate.toISOString()}`);
	log('');

	// Find stale drafts
	let draftsWithPubs: { draft: Draft; pubId: string }[];

	if (specificPubId) {
		const pub = await Pub.findOne({
			where: { id: specificPubId },
			include: [{ model: Draft, as: 'draft' }],
		});
		if (!pub?.draft) {
			log(`No draft found for pub ${specificPubId}`);
			process.exit(1);
		}
		draftsWithPubs = [{ draft: pub.draft, pubId: pub.id }];
		log(`Processing single pub: ${specificPubId}`);
	} else {
		// First, list what actually exists in Firebase (one shallow REST call).
		// This avoids doing tens of thousands of per-draft Firebase checks for
		// drafts that have no data (already cold-stored or never had any).
		log('Listing Firebase paths with data...');
		const firebaseDraftKeys = await firebaseRest<Record<string, true> | null>(
			'GET',
			'drafts',
			undefined,
			{ shallow: 'true' },
		);
		const firebaseDraftIds = new Set(
			firebaseDraftKeys
				? Object.keys(firebaseDraftKeys).map((k) => k.replace('draft-', ''))
				: [],
		);
		log(`Found ${firebaseDraftIds.size} drafts with Firebase data`);

		// Find stale drafts that ALSO have Firebase data
		const results = await sequelize.query<{ draftId: string; pubId: string }>(
			`
			SELECT d.id as "draftId", p.id as "pubId"
			FROM "Drafts" d
			INNER JOIN "Pubs" p ON p."draftId" = d.id
			WHERE (d."latestKeyAt" IS NULL OR d."latestKeyAt" < :cutoff)
			ORDER BY d."latestKeyAt" ASC NULLS FIRST
			`,
			{
				replacements: { cutoff: cutoffDate.toISOString() },
				type: QueryTypes.SELECT,
			},
		);

		// Intersect: only process drafts that are stale AND have Firebase data
		const filteredResults = results.filter((r) => firebaseDraftIds.has(r.draftId));
		log(
			`${results.length} stale drafts total, ${filteredResults.length} with Firebase data to freeze`,
		);

		// Load draft models
		const draftIds = filteredResults.map((r) => r.draftId);
		const pubIdByDraftId = new Map(filteredResults.map((r) => [r.draftId, r.pubId]));

		const drafts = await Draft.findAll({
			where: { id: { [Op.in]: draftIds } },
		});

		draftsWithPubs = drafts.map((d) => ({
			draft: d,
			pubId: pubIdByDraftId.get(d.id)!,
		}));

		log(`Found ${draftsWithPubs.length} stale drafts (older than ${DAYS_OLD} days)`);
	}

	log('');

	// Process in batches
	for (let i = 0; i < draftsWithPubs.length; i += BATCH_SIZE) {
		const batch = draftsWithPubs.slice(i, i + BATCH_SIZE);
		const batchNum = Math.floor(i / BATCH_SIZE) + 1;
		const totalBatches = Math.ceil(draftsWithPubs.length / BATCH_SIZE);

		log(`Batch ${batchNum}/${totalBatches} (${batch.length} drafts)`);

		// biome-ignore lint/performance/noAwaitInLoops: batched processing
		await runWithConcurrency(
			batch.map(
				({ draft, pubId }) =>
					() =>
						freezeDraft(draft, pubId),
			),
			CONCURRENCY,
		);

		log(`  Frozen so far: ${stats.draftsFrozen}, Errors: ${stats.draftsSkippedError}`);
	}

	log('');
	log('=== RESULTS ===');
	log(`Drafts scanned:       ${stats.draftsScanned}`);
	log(`Drafts frozen:        ${stats.draftsFrozen}`);
	log(`Already cold/empty:   ${stats.draftsAlreadyCold + stats.draftsEmpty}`);
	log(`Errors:               ${stats.draftsSkippedError}`);
	if (isDryRun) {
		log(`Est. data to free:    ${formatBytes(stats.bytesFreed)}`);
	}
	log('');

	if (isDryRun) {
		log('This was a DRY RUN. Re-run with --execute to apply changes.');
	}

	process.exit(0);
};

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
