/**
 * Bootstrap Draft Checkpoints
 *
 * A one-time migration that:
 * 1. Normalizes legacy Firebase paths (pub-{id}/branch-{id} → drafts/draft-{id})
 * 2. Copies the latest checkpoint from Firebase into the DraftCheckpoints Postgres table
 *
 * After this script runs, every draft with Firebase data will have a Postgres
 * checkpoint. New checkpoints are written directly to Postgres by the client,
 * so this script only needs to run once.
 *
 * Safety:
 * - Dry run by default (use --execute to actually write)
 * - Single draft with --draftId=<uuid>
 * - Concurrency control with --concurrency=N (default 20, for path normalization)
 * - Separate --extractConcurrency=N for checkpoint extraction (default 5)
 *
 * Usage:
 *   pnpm run tools bootstrapCheckpoints                      # Dry run
 *   pnpm run tools bootstrapCheckpoints --execute            # Actually migrate
 *   pnpm run tools bootstrapCheckpoints --draftId=<uuid>     # Single draft
 *   pnpm run tools bootstrapCheckpoints --execute --extractConcurrency=3  # Slower but safer
 *   pnpm run tools bootstrapCheckpoints --execute --replaceErrors        # Write fallback docs for corrupted drafts
 */

import firebaseAdmin from 'firebase-admin';
import { Op, QueryTypes } from 'sequelize';

import { editorSchema, getStepsInChangeRange } from 'components/Editor';
import { flattenKeyables } from 'components/Editor/utils';
import { Community, Doc, Draft, DraftCheckpoint, Pub, Release } from 'server/models';
import { sequelize } from 'server/sequelize';
import { getDatabaseRef } from 'server/utils/firebaseAdmin';
import { getFirebaseConfig } from 'utils/editor/firebaseConfig';

const {
	argv: {
		execute,
		draftId: specificDraftId,
		concurrency: concurrencyArg = 20,
		extractConcurrency: extractConcurrencyArg = 5,
		verbose: verboseFlag,
		skipPathNormalization,
		replaceErrors: replaceErrorsFlag = false,
	},
} = require('yargs');

const isDryRun = !execute;
// Path normalization copies entire Firebase trees (all checkpoints, changes,
// discussions) so even this needs conservative concurrency to avoid
// overwhelming Firebase or OOMing the container.
const CONCURRENCY = Number(concurrencyArg);
const EXTRACT_CONCURRENCY = Number(extractConcurrencyArg);
const REPLACE_ERRORS = !!replaceErrorsFlag;

// biome-ignore lint/suspicious/noConsole: CLI tool output
const log = (msg: string) => console.log(`[bootstrap] ${new Date().toISOString()} ${msg}`);
const verbose = (msg: string) => verboseFlag && log(msg);

// --- Stats ---

interface BootstrapStats {
	pathsNormalized: number;
	pathsSkipped: number;
	pathsFailed: number;
	checkpointsCreated: number;
	checkpointsSkippedEmpty: number;
	checkpointsSkippedExisting: number;
	checkpointsFailed: number;
	totalDrafts: number;
}

const stats: BootstrapStats = {
	pathsNormalized: 0,
	pathsSkipped: 0,
	pathsFailed: 0,
	checkpointsCreated: 0,
	checkpointsSkippedEmpty: 0,
	checkpointsSkippedExisting: 0,
	checkpointsFailed: 0,
	totalDrafts: 0,
};

// --- Concurrency helper ---

let totalCompleted = 0;

const runWithConcurrency = async <T>(
	tasks: (() => Promise<T>)[],
	concurrency: number,
	progressLabel?: string,
): Promise<T[]> => {
	const results: T[] = [];
	let index = 0;
	const total = tasks.length;
	const inFlight = new Set<number>();

	// Periodically log progress so we can detect hangs
	const heartbeat = setInterval(() => {
		if (inFlight.size > 0) {
			log(
				`  [${progressLabel ?? '?'}] heartbeat: ${totalCompleted}/${total} done, ${inFlight.size} in flight`,
			);
		}
	}, 30_000);

	const worker = async (): Promise<void> => {
		while (index < tasks.length) {
			const currentIndex = index++;
			inFlight.add(currentIndex);
			try {
				// biome-ignore lint/performance/noAwaitInLoops: worker pool pattern
				results[currentIndex] = await tasks[currentIndex]();
			} catch (err: any) {
				log(`  [${progressLabel ?? '?'}] task ${currentIndex} failed: ${err.message}`);
				results[currentIndex] = undefined as any;
			}
			inFlight.delete(currentIndex);
			totalCompleted++;
			if (progressLabel && totalCompleted % 500 === 0) {
				log(`  [${progressLabel}] ${totalCompleted}/${total} done`);
			}
		}
	};
	totalCompleted = 0;
	try {
		await Promise.all(
			Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()),
		);
	} finally {
		clearInterval(heartbeat);
	}
	return results;
};

// --- Firebase REST helpers (avoid SDK WebSocket throttling) ---
// All Phase 1 operations use REST to avoid the SDK's shared persistent
// WebSocket connection, which Firebase silently throttles under load.

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

const REST_TIMEOUT_MS = 60_000; // 60s for REST (longer than SDK since these actually complete)
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

const getShallowKeys = async (path: string): Promise<string[]> => {
	const data = await firebaseRest<Record<string, true> | null>('GET', path, undefined, {
		shallow: 'true',
	});
	if (!data || typeof data !== 'object') return [];
	return Object.keys(data);
};

// --- Phase 1: Path normalization ---

const isLegacyPath = (path: string): boolean => {
	return /^pub-[^/]+\/branch-[^/]+$/.test(path);
};

const getModernPath = (draftId: string): string => {
	return `drafts/draft-${draftId}`;
};

/**
 * Copy Firebase data from source to dest, child-by-child.
 * Uses shallow key listing so we never load the entire tree into memory.
 * For children that are themselves large key-value maps (changes, merges,
 * checkpoints), we copy in paginated batches.
 */
const LARGE_CHILDREN = new Set(['changes', 'merges', 'checkpoints', 'checkpointMap']);
const COPY_BATCH_SIZE = 500;

const copyFirebaseChild = async (
	sourcePath: string,
	destPath: string,
	childKey: string,
): Promise<void> => {
	const srcChildPath = `${sourcePath}/${childKey}`;
	const dstChildPath = `${destPath}/${childKey}`;

	if (!LARGE_CHILDREN.has(childKey)) {
		// Small child — copy in one shot via REST
		const data = await firebaseRest('GET', srcChildPath);
		if (data != null) {
			await firebaseRest('PUT', dstChildPath, data);
		}
		return;
	}

	// Large child — copy in paginated batches via REST
	const keys = await getShallowKeys(srcChildPath);
	if (keys.length === 0) return;

	// Sort keys numerically
	const sortedKeys = keys
		.map((k) => parseInt(k, 10))
		.filter((k) => !Number.isNaN(k))
		.sort((a, b) => a - b);

	if (sortedKeys.length > COPY_BATCH_SIZE) {
		verbose(
			`    ${childKey}: ${sortedKeys.length} entries, copying in batches of ${COPY_BATCH_SIZE}`,
		);
	}

	for (let i = 0; i < sortedKeys.length; i += COPY_BATCH_SIZE) {
		const batchStart = sortedKeys[i];
		const batchEnd = sortedKeys[Math.min(i + COPY_BATCH_SIZE - 1, sortedKeys.length - 1)];

		// REST read with orderBy/startAt/endAt query params
		// biome-ignore lint/performance/noAwaitInLoops: sequential batch copy
		const data = await firebaseRest<Record<string, any> | any[] | null>(
			'GET',
			srcChildPath,
			undefined,
			{
				orderBy: '"$key"',
				startAt: `"${batchStart}"`,
				endAt: `"${batchEnd}"`,
			},
		);

		// REST may return a sparse array for consecutive integer keys.
		// Normalize to a plain object so PATCH doesn't choke on undefined holes.
		let updates: Record<string, any> = {};
		if (Array.isArray(data)) {
			for (let idx = 0; idx < data.length; idx++) {
				if (data[idx] !== undefined && data[idx] !== null) {
					updates[String(idx)] = data[idx];
				}
			}
		} else if (data && typeof data === 'object') {
			updates = data;
		}

		if (Object.keys(updates).length > 0) {
			try {
				// PATCH = multi-path update
				await firebaseRest('PATCH', dstChildPath, updates);
			} catch (patchErr: any) {
				const patchMsg = patchErr?.message || String(patchErr);
				if (
					patchMsg.includes('Data to write exceeds') ||
					patchMsg.includes('WRITE_TOO_BIG') ||
					patchMsg.includes('write_too_big')
				) {
					// Batch too large — fall back to writing each key individually via PUT
					verbose(
						`    ${childKey}: batch ${batchStart}-${batchEnd} too large, copying individually`,
					);
					for (const [key, value] of Object.entries(updates)) {
						// biome-ignore lint/performance/noAwaitInLoops: sequential fallback
						await firebaseRest('PUT', `${dstChildPath}/${key}`, value);
					}
				} else {
					throw patchErr;
				}
			}
		}
		if (sortedKeys.length > COPY_BATCH_SIZE) {
			verbose(
				`    ${childKey}: copied ${Math.min(i + COPY_BATCH_SIZE, sortedKeys.length)}/${sortedKeys.length}`,
			);
		}
	}
};

const copyFirebaseData = async (sourcePath: string, destPath: string): Promise<boolean> => {
	const topKeys = await getShallowKeys(sourcePath);
	if (topKeys.length === 0) return false;

	for (const childKey of topKeys) {
		// biome-ignore lint/performance/noAwaitInLoops: sequential copy of children
		await copyFirebaseChild(sourcePath, destPath, childKey);
	}
	return true;
};

/**
 * Recursively delete a Firebase path, handling WRITE_TOO_BIG by shallowly
 * listing children and deleting them individually (or recursing further).
 * For large key-value children, uses batch multi-path updates.
 */
const DELETE_BATCH_SIZE = 2500;

const deleteFirebasePath = async (path: string): Promise<void> => {
	try {
		await firebaseRest('DELETE', path);
	} catch (err: any) {
		const msg = err?.message || String(err);
		if (
			!msg.includes('Data to write exceeds') &&
			!msg.includes('WRITE_TOO_BIG') &&
			!msg.includes('write_too_big')
		)
			throw err;

		verbose(`    ${path} too large, deleting in batches`);
		const childKeys = await getShallowKeys(path);

		// Try batch multi-path PATCH with nulls (much faster than individual deletes)
		for (let i = 0; i < childKeys.length; i += DELETE_BATCH_SIZE) {
			const batch = childKeys.slice(i, i + DELETE_BATCH_SIZE);
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
					// Batch too large, fall back to individual recursive deletes
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

const normalizePath = async (draft: Draft): Promise<void> => {
	const { id, firebasePath } = draft;
	if (!firebasePath || !isLegacyPath(firebasePath)) {
		stats.pathsSkipped++;
		return;
	}

	const modernPath = getModernPath(id);

	if (isDryRun) {
		verbose(`  [path] Would normalize ${id}: ${firebasePath} → ${modernPath}`);
		stats.pathsNormalized++;
		return;
	}

	try {
		const hasData = await copyFirebaseData(firebasePath, modernPath);
		if (!hasData) {
			verbose(`  [path] ${id}: no data at ${firebasePath}, updating path only`);
		}

		await draft.update({ firebasePath: modernPath });

		if (hasData) {
			await deleteFirebasePath(firebasePath);
		}

		stats.pathsNormalized++;
		verbose(`  [path] Normalized ${id}`);
	} catch (err: any) {
		log(`  [path] ERROR ${id}: ${err.message}`);
		stats.pathsFailed++;
	}
};

// --- Phase 2: Checkpoint extraction ---

const extractCheckpoint = async (draft: Draft): Promise<void> => {
	const { id: draftId, firebasePath } = draft;

	if (!firebasePath) {
		stats.checkpointsSkippedEmpty++;
		return;
	}

	// Skip if a checkpoint already exists
	const existing = await DraftCheckpoint.findOne({ where: { draftId } });
	if (existing) {
		verbose(`  [ckpt] ${draftId}: already has PG checkpoint at key ${existing.historyKey}`);
		stats.checkpointsSkippedExisting++;
		return;
	}

	// Quick REST check: if the Firebase path has no data at all, skip.
	// This avoids the expensive SDK getFirebaseDoc call on re-runs
	// for drafts we've already determined are empty.
	const topKeys = await getShallowKeys(firebasePath);
	if (topKeys.length === 0) {
		verbose(`  [ckpt] ${draftId}: no data in Firebase, skipping`);
		stats.checkpointsSkippedEmpty++;
		return;
	}

	try {
		const draftRef = getDatabaseRef(firebasePath);
		const { uncompressStateJSON, uncompressStepJSON } = require('prosemirror-compress-pubpub');
		const { Node } = require('prosemirror-model');
		const { Step } = require('prosemirror-transform');

		// --- Step 1: Read Firebase checkpoint ---
		let baseDoc: any = null;
		let baseKey = -1;
		let baseTimestamp: number | null = null;

		const checkpointMapSnap = await draftRef.child('checkpointMap').once('value');
		const checkpointMap = checkpointMapSnap.val();
		if (checkpointMap) {
			const bestKey = Object.keys(checkpointMap)
				.map((k) => parseInt(k, 10))
				.reduce((a, b) => Math.max(a, b), -1);
			if (bestKey >= 0) {
				const ckptSnap = await draftRef.child(`checkpoints/${bestKey}`).once('value');
				const ckpt = ckptSnap.val();
				if (ckpt) {
					const { doc: ckptDoc } = uncompressStateJSON(ckpt);
					baseDoc = Node.fromJSON(editorSchema, ckptDoc);
					baseKey = bestKey;
					baseTimestamp = ckpt.t ?? null;
				}
			}
		}
		if (!baseDoc) {
			// Try deprecated single 'checkpoint' key
			const oldCkptSnap = await draftRef.child('checkpoint').once('value');
			const oldCkpt = oldCkptSnap.val();
			if (oldCkpt) {
				const { doc: ckptDoc } = uncompressStateJSON(oldCkpt);
				baseDoc = Node.fromJSON(editorSchema, ckptDoc);
				baseKey = parseInt(oldCkpt.k, 10) || 0;
				baseTimestamp = oldCkpt.t ?? null;
			}
		}
		if (!baseDoc) {
			// No checkpoint at all — start from empty doc
			baseDoc = Node.fromJSON(editorSchema, {
				type: 'doc',
				attrs: { meta: {} },
				content: [{ type: 'paragraph' }],
			});
			baseKey = -1;
		}

		// --- Step 2: Apply changes resiliently (skip broken steps) ---
		const [changesSnap, mergesSnap] = await Promise.all([
			draftRef
				.child('changes')
				.orderByKey()
				.startAt(String(baseKey + 1))
				.once('value'),
			draftRef
				.child('merges')
				.orderByKey()
				.startAt(String(baseKey + 1))
				.once('value'),
		]);

		const allKeyables = { ...changesSnap.val(), ...mergesSnap.val() };
		const flattenedChanges = flattenKeyables(allKeyables);
		const totalSteps = flattenedChanges.reduce((sum: number, c: any) => sum + c.s.length, 0);

		const orderedChangeKeys = Object.keys(allKeyables)
			.map((k) => parseInt(k, 10))
			.sort((a, b) => a - b);
		const latestFirebaseKey = orderedChangeKeys.length
			? orderedChangeKeys[orderedChangeKeys.length - 1]
			: baseKey;

		let currentDoc = baseDoc;
		let appliedCount = 0;
		let hitError = false;
		let lastAppliedKey = baseKey;

		let replayError: string | null = null;
		for (const changeKey of orderedChangeKeys) {
			const entry = allKeyables[String(changeKey)];
			const changesAtKey: any[] = Array.isArray(entry) ? entry : [entry];
			for (const change of changesAtKey) {
				try {
					const stepsInChange = change.s.map(uncompressStepJSON);
					for (const stepJson of stepsInChange) {
						const step = Step.fromJSON(editorSchema, stepJson);
						const { failed, doc: nextDoc } = step.apply(currentDoc);
						if (failed || !nextDoc) {
							replayError = failed || 'step.apply returned null doc';
							hitError = true;
							break;
						}
						currentDoc = nextDoc;
						appliedCount++;
					}
				} catch (stepErr: any) {
					replayError = stepErr?.message || String(stepErr);
					hitError = true;
				}
				if (hitError) break;
			}
			if (!hitError) lastAppliedKey = changeKey;
			if (hitError) break;
		}
		const replayTimestamp: number | null =
			flattenedChanges.length > 0
				? Number(flattenedChanges[flattenedChanges.length - 1].t) || null
				: baseTimestamp;

		if (!hitError && latestFirebaseKey < 0 && !currentDoc) {
			verbose(`  [ckpt] ${draftId}: no history in Firebase`);
			stats.checkpointsSkippedEmpty++;
			return;
		}

		// If replay hit an error, we have a partial doc (last good state before the break).
		// Check if we can do better with a release doc.
		let docJson = currentDoc.toJSON();
		let checkpointKey = latestFirebaseKey; // Use the full range key for a clean replay
		const checkpointTimestamp = replayTimestamp;

		if (hitError) {
			// Our doc is valid but only up to where replay broke.
			// The checkpointKey should reflect the actual state of the doc,
			// but we use latestFirebaseKey so cold storage knows the full range.
			// Check if a release doc is better.
			const pub = await Pub.findOne({
				where: { draftId },
				attributes: ['id', 'title', 'slug'],
				include: [
					{ model: Community, as: 'community', attributes: ['subdomain', 'title'] },
				],
			});
			const pubLabel = pub
				? `"${pub.title}" (${pub.community?.subdomain ?? '?'})`
				: '(no pub)';
			let releaseKey = -1;
			let releaseDocJson: any = null;
			if (pub) {
				const latestRelease = await Release.findOne({
					where: { pubId: pub.id },
					attributes: ['historyKey', 'docId'],
					order: [['historyKey', 'DESC']],
					include: [{ model: Doc, as: 'doc', attributes: ['content'] }],
				});
				if (latestRelease?.doc?.content) {
					releaseKey = latestRelease.historyKey;
					releaseDocJson = latestRelease.doc.content;
				}
			}

			// Pick the best: whichever represents a more recent state.
			// lastAppliedKey = the last fully-replayed change key.
			// The release is at releaseKey.

			const lostSteps = totalSteps - appliedCount;
			const diagPrefix =
				`  [ckpt] ${draftId} ${pubLabel}: replay broke at step ${appliedCount}/${totalSteps} ` +
				`(${lostSteps} steps lost, last good key ${lastAppliedKey}, error: ${replayError})`;

			if (releaseDocJson && releaseKey > lastAppliedKey) {
				log(`${diagPrefix}, release doc at key ${releaseKey} is newer — will use release`);
				docJson = releaseDocJson;
				checkpointKey = releaseKey;
			} else {
				log(
					`${diagPrefix}, latest firebase key ${latestFirebaseKey}` +
						(releaseKey >= 0
							? `, release at key ${releaseKey} (not newer)`
							: ', no release') +
						` — will use last good replay state`,
				);
				checkpointKey = latestFirebaseKey;
			}

			if (!REPLACE_ERRORS) {
				log(`  [ckpt] ${draftId}: --replaceErrors not set, skipping write`);
				stats.checkpointsFailed++;
				return;
			}
		}

		// --- Compute stepMaps from latest release ---
		let stepMaps: number[][] | null = null;
		const pubForMaps = hitError
			? null
			: await Pub.findOne({ where: { draftId }, attributes: ['id'] });
		if (pubForMaps) {
			const latestRelease = await Release.findOne({
				where: { pubId: pubForMaps.id },
				attributes: ['historyKey'],
				order: [['historyKey', 'DESC']],
			});
			if (latestRelease && latestRelease.historyKey < checkpointKey) {
				try {
					const stepsByChange = await getStepsInChangeRange(
						draftRef,
						editorSchema,
						latestRelease.historyKey + 1,
						checkpointKey,
					);
					const allSteps = stepsByChange.reduce((a: any, b: any) => [...a, ...b], []);
					if (allSteps.length > 0) {
						stepMaps = allSteps.map((step: any) =>
							Array.from((step.getMap() as any).ranges as number[]),
						);
					}
				} catch {
					verbose(`  [ckpt] ${draftId}: could not compute stepMaps (ok, non-fatal)`);
				}
			}
		}

		if (isDryRun) {
			verbose(
				`  [ckpt] Would create checkpoint for ${draftId}: key=${checkpointKey}, size=${JSON.stringify(docJson).length}B, stepMaps=${stepMaps?.length ?? 0}`,
			);
			stats.checkpointsCreated++;
			return;
		}

		await DraftCheckpoint.create({
			draftId,
			historyKey: checkpointKey,
			doc: docJson,
			timestamp: checkpointTimestamp,
			stepMaps,
			stepMapToKey: stepMaps ? checkpointKey : null,
		});

		// Backfill latestKeyAt if it's null — prevents cold storage from treating
		// this draft as "never tracked" and freezing it immediately.
		if (!draft.latestKeyAt && checkpointTimestamp) {
			await draft.update({ latestKeyAt: new Date(checkpointTimestamp) });
		}

		stats.checkpointsCreated++;
		verbose(`  [ckpt] Created checkpoint for ${draftId} at key ${checkpointKey}`);
	} catch (err: any) {
		log(`  [ckpt] ERROR ${draftId}: ${err.message}`);
		stats.checkpointsFailed++;
	}
};

// --- Main ---

const main = async () => {
	log('Bootstrap Draft Checkpoints');
	log(`Mode: ${isDryRun ? 'DRY RUN' : 'EXECUTE'}`);
	log(
		`Concurrency: ${CONCURRENCY} (path normalization), ${EXTRACT_CONCURRENCY} (checkpoint extraction)`,
	);
	log('');

	// Load all drafts
	const whereClause: any = {};
	if (specificDraftId) {
		whereClause.id = specificDraftId;
	}

	const drafts = await Draft.findAll({
		where: whereClause,
		order: [['id', 'ASC']],
	});

	stats.totalDrafts = drafts.length;
	log(`Found ${drafts.length} drafts`);

	// Phase 1: Normalize legacy paths (rolling concurrency)
	if (!skipPathNormalization) {
		const legacyDrafts = drafts.filter((d) => d.firebasePath && isLegacyPath(d.firebasePath));
		log('');
		log(
			`Phase 1: Path normalization (${legacyDrafts.length} legacy paths, concurrency=${CONCURRENCY})`,
		);

		await runWithConcurrency(
			legacyDrafts.map((draft) => () => normalizePath(draft)),
			CONCURRENCY,
			'path',
		);
		log(
			`  Normalized: ${stats.pathsNormalized}, Skipped: ${stats.pathsSkipped}, Failed: ${stats.pathsFailed}`,
		);
	} else {
		log('Phase 1: Skipped (--skipPathNormalization)');
	}

	// Phase 2: Extract checkpoints (rolling concurrency)
	log('');

	// Reload drafts to get updated paths after normalization
	const updatedDrafts = await Draft.findAll({
		where: whereClause,
		order: [['id', 'ASC']],
	});

	log(
		`Phase 2: Extract checkpoints to Postgres (${updatedDrafts.length} drafts, concurrency=${EXTRACT_CONCURRENCY})`,
	);

	await runWithConcurrency(
		updatedDrafts.map((draft) => () => extractCheckpoint(draft)),
		EXTRACT_CONCURRENCY,
		'ckpt',
	);

	// Summary
	log('');
	log('='.repeat(60));
	log('Summary');
	log('='.repeat(60));
	log(`Total drafts:            ${stats.totalDrafts}`);
	log('');
	log('Path normalization:');
	log(`  Normalized:            ${stats.pathsNormalized}`);
	log(`  Skipped (modern):      ${stats.pathsSkipped}`);
	log(`  Failed:                ${stats.pathsFailed}`);
	log('');
	log('Checkpoint extraction:');
	log(`  Created:               ${stats.checkpointsCreated}`);
	log(`  Skipped (existing):    ${stats.checkpointsSkippedExisting}`);
	log(`  Skipped (empty):       ${stats.checkpointsSkippedEmpty}`);
	log(`  Failed:                ${stats.checkpointsFailed}`);

	if (isDryRun) {
		log('');
		log('This was a DRY RUN. Use --execute to apply changes.');
	}

	process.exit(0);
};

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
