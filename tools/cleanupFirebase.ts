/**
 * Firebase Cleanup Tool
 *
 * Reduces Firebase storage costs by:
 * 1. Fast-forwarding outdated discussions to the safe prune threshold
 * 2. Pruning changes/merges/checkpoints before the safe prune threshold
 * 3. Removing orphaned drafts (drafts without an associated Pub)
 * 4. Removing orphaned Firebase paths (paths not referenced in Postgres)
 *
 * IMPORTANT: The safe prune threshold is min(latestCheckpointKey, latestReleaseKey).
 * - We must preserve changes from latestCheckpointKey onwards to reconstruct the doc
 * - We must preserve changes from latestReleaseKey onwards for discussion migration during release
 *
 * Usage:
 *   pnpm run tools cleanupFirebase                    # Dry run, all drafts
 *   pnpm run tools cleanupFirebase --execute          # Actually delete data
 *   pnpm run tools cleanupFirebase --pubId=<uuid>     # Test on single pub
 *   pnpm run tools cleanupFirebase --pubId=<uuid> --execute
 */

import type firebase from 'firebase';

import type { DiscussionInfo } from 'components/Editor/plugins/discussions/types';

import firebaseAdmin from 'firebase-admin';
import {
	compressSelectionJSON,
	compressStateJSON,
	uncompressSelectionJSON,
} from 'prosemirror-compress-pubpub';
import { QueryTypes } from 'sequelize';

import { editorSchema, getFirebaseDoc } from 'components/Editor';
import { createFastForwarder } from 'components/Editor/plugins/discussions/fastForward';
import { Draft, Pub, Release } from 'server/models';
import { sequelize } from 'server/sequelize';
import { getDatabaseRef } from 'server/utils/firebaseAdmin';
import { postToSlack } from 'server/utils/slack';
import { getFirebaseConfig } from 'utils/editor/firebaseConfig';

const {
	argv: { execute, pubId, draftId, batchSize = 100, verbose: verboseFlag, scanFirebase = true },
} = require('yargs');

const isDryRun = !execute;
const isVerbose = verboseFlag;

// biome-ignore lint/suspicious/noConsole: CLI tool output
const log = (msg: string) => console.log(`[cleanup] ${new Date().toISOString()} ${msg}`);
const verbose = (msg: string) => isVerbose && log(msg);

/**
 * Fetch only the keys at a Firebase path using REST API with shallow=true
 * This avoids loading potentially huge amounts of data
 */
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

const getShallowKeys = async (path: string, retries = 3): Promise<string[]> => {
	const databaseURL = getFirebaseConfig().databaseURL;
	const accessToken = await getAccessToken();

	const url = `${databaseURL}/${path}.json?shallow=true&access_token=${accessToken}`;

	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			// biome-ignore lint/performance/noAwaitInLoops: intentionally sequential
			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(
					`Firebase REST API error: ${response.status} ${response.statusText}`,
				);
			}

			const data = await response.json();
			if (!data || typeof data !== 'object') {
				return [];
			}
			return Object.keys(data);
		} catch (error: any) {
			if (attempt === retries) {
				throw error;
			}
			const delay = Math.min(1000 * 2 ** attempt, 10000);
			verbose(`  Retry ${attempt}/${retries} for ${path} after ${delay}ms: ${error.message}`);
			await new Promise((r) => setTimeout(r, delay));
		}
	}
	return []; // unreachable
};

/**
 * Recursively delete a Firebase path, handling WRITE_TOO_BIG errors by
 * deleting children first. This is necessary for large subtrees.
 */
const deleteFirebasePath = async (path: string, depth = 0): Promise<void> => {
	const indent = '  '.repeat(depth);
	try {
		await getDatabaseRef(path).remove();
		verbose(`${indent}Deleted: ${path}`);
	} catch (error: any) {
		const errorCode = error?.code || error?.message || String(error);
		if (errorCode.includes('WRITE_TOO_BIG') || errorCode.includes('write_too_big')) {
			verbose(`${indent}Path too large for single delete, deleting children first: ${path}`);
			// Get children and delete them with concurrency
			const childKeys = await getShallowKeys(path);
			await runWithConcurrency(
				childKeys.map(
					(childKey) => () => deleteFirebasePath(`${path}/${childKey}`, depth + 1),
				),
				30,
			);
			// Now delete the (empty) parent
			await getDatabaseRef(path).remove();
			verbose(`${indent}Deleted (after children): ${path}`);
		} else {
			throw error;
		}
	}
};

/**
 * Run async tasks with limited concurrency (worker pool pattern)
 */
const runWithConcurrency = async <T>(
	tasks: (() => Promise<T>)[],
	concurrency: number,
): Promise<T[]> => {
	const results: T[] = [];
	let index = 0;

	const worker = async (): Promise<void> => {
		while (index < tasks.length) {
			const currentIndex = index++;
			// biome-ignore lint/performance/noAwaitInLoops: worker pool pattern requires sequential processing
			results[currentIndex] = await tasks[currentIndex]();
		}
	};

	const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
	await Promise.all(workers);
	return results;
};

interface CleanupStats {
	draftsProcessed: number;
	draftsSkipped: number;
	orphanedDraftsFound: number;
	orphanedDraftsDeleted: number;
	orphanedFirebasePathsFound: number;
	orphanedFirebasePathsDeleted: number;
	discussionsUpdated: number;
	changesDeleted: number;
	mergesDeleted: number;
	checkpointsDeleted: number;
	checkpointsCreated: number;
	metadataDeleted: number;
	errorsEncountered: number;
}

const stats: CleanupStats = {
	draftsProcessed: 0,
	draftsSkipped: 0,
	orphanedDraftsFound: 0,
	orphanedDraftsDeleted: 0,
	orphanedFirebasePathsFound: 0,
	orphanedFirebasePathsDeleted: 0,
	discussionsUpdated: 0,
	changesDeleted: 0,
	mergesDeleted: 0,
	checkpointsDeleted: 0,
	checkpointsCreated: 0,
	metadataDeleted: 0,
	errorsEncountered: 0,
};

/**
 * Get all checkpoint keys for a draft
 */
const getCheckpointKeys = async (draftRef: firebase.database.Reference): Promise<number[]> => {
	const checkpointMapSnapshot = await draftRef.child('checkpointMap').once('value');
	const checkpointMap = checkpointMapSnapshot.val();

	if (!checkpointMap) {
		// Try the deprecated singular checkpoint
		const checkpointSnapshot = await draftRef.child('checkpoint').once('value');
		const checkpoint = checkpointSnapshot.val();
		if (checkpoint?.k) {
			return [parseInt(checkpoint.k, 10)];
		}
		return [];
	}

	return Object.keys(checkpointMap).map((k) => parseInt(k, 10));
};

/**
 * Get the highest checkpoint key for a draft
 */
const getLatestCheckpointKey = async (
	draftRef: firebase.database.Reference,
): Promise<number | null> => {
	const keys = await getCheckpointKeys(draftRef);
	if (keys.length === 0) return null;
	return Math.max(...keys);
};

/**
 * Get the highest checkpoint key at or before a threshold
 */
const getCheckpointKeyAtOrBefore = async (
	draftRef: firebase.database.Reference,
	threshold: number,
): Promise<number | null> => {
	const keys = await getCheckpointKeys(draftRef);
	const validKeys = keys.filter((k) => k <= threshold);
	if (validKeys.length === 0) return null;
	return Math.max(...validKeys);
};

/**
 * Get the latest release history key for a pub
 */
const getLatestReleaseHistoryKey = async (pubId: string): Promise<number | null> => {
	const release = await Release.findOne({
		where: { pubId },
		attributes: ['historyKey'],
		order: [['historyKey', 'DESC']],
	});
	return release?.historyKey ?? null;
};

/**
 * Batch fetch latest release history keys for multiple pubs
 * More efficient than individual queries
 */
const batchGetLatestReleaseKeys = async (pubIds: string[]): Promise<Map<string, number>> => {
	if (pubIds.length === 0) return new Map();

	const releases = await Release.findAll({
		where: { pubId: pubIds },
		attributes: ['pubId', 'historyKey'],
		order: [['historyKey', 'DESC']],
	});

	// Group by pubId and take the max historyKey for each
	const result = new Map<string, number>();
	for (const release of releases) {
		const existing = result.get(release.pubId);
		if (existing === undefined || release.historyKey > existing) {
			result.set(release.pubId, release.historyKey);
		}
	}
	return result;
};

/**
 * Get discussions from Firebase and uncompress them
 */
const getFirebaseDiscussions = async (
	draftRef: firebase.database.Reference,
): Promise<Record<string, DiscussionInfo>> => {
	const discussionsSnapshot = await draftRef.child('discussions').once('value');
	const discussionsData = discussionsSnapshot.val();

	if (!discussionsData) {
		return {};
	}

	const discussions: Record<string, DiscussionInfo> = {};
	for (const [id, compressed] of Object.entries(discussionsData as Record<string, any>)) {
		const selection = compressed.selection
			? uncompressSelectionJSON(compressed.selection)
			: null;
		discussions[id] = {
			...compressed,
			selection,
		};
	}
	return discussions;
};

/**
 * Fast-forward all outdated discussions to the target key
 */
const fastForwardDiscussions = async (
	draftRef: firebase.database.Reference,
	targetKey: number,
): Promise<number> => {
	const discussions = await getFirebaseDiscussions(draftRef);
	const outdatedDiscussions = Object.entries(discussions).filter(
		([_, d]) => d && d.currentKey < targetKey,
	);

	if (outdatedDiscussions.length === 0) {
		return 0;
	}

	verbose(`  Found ${outdatedDiscussions.length} outdated discussions`);

	// Get the current doc at targetKey to use for fast-forwarding
	const { doc } = await getFirebaseDoc(draftRef, editorSchema, targetKey);
	const fastForward = createFastForwarder(draftRef);

	const discussionsById: Record<string, DiscussionInfo> = {};
	for (const [id, discussion] of outdatedDiscussions) {
		discussionsById[id] = discussion;
	}

	const fastForwardedDiscussions = await fastForward(discussionsById, doc, targetKey);

	// Collect all updates for batch write
	const updates: Record<string, any> = {};
	let updatedCount = 0;
	for (const [id, updatedDiscussion] of Object.entries(fastForwardedDiscussions)) {
		if (updatedDiscussion) {
			verbose(
				`  Fast-forwarding discussion ${id} from ${discussions[id].currentKey} to ${targetKey}`,
			);
			const compressed = {
				...updatedDiscussion,
				selection: updatedDiscussion.selection
					? compressSelectionJSON(updatedDiscussion.selection)
					: null,
			};
			updates[id] = compressed;
			updatedCount++;
		}
	}

	// Write all discussion updates in a single batch
	if (!isDryRun && updatedCount > 0) {
		await draftRef.child('discussions').update(updates);
	}

	return updatedCount;
};

/**
 * Count and optionally delete keys before a threshold in a Firebase child.
 * Uses shallow key listing to avoid loading content into memory.
 * Uses batch multi-path updates for much faster deletion.
 */
const pruneKeysBefore = async (
	parentRef: firebase.database.Reference,
	childName: string,
	thresholdKey: number,
): Promise<number> => {
	// Get parent path and use shallow key listing
	const parentPath = parentRef.toString().replace(/^https:\/\/[^/]+\//, '');
	const childPath = parentPath ? `${parentPath}/${childName}` : childName;

	const allKeys = await getShallowKeys(childPath);
	const keysToDelete = allKeys
		.map((k) => parseInt(k, 10))
		.filter((k) => !Number.isNaN(k) && k < thresholdKey)
		.map((k) => String(k));

	if (keysToDelete.length === 0) {
		return 0;
	}

	verbose(`  Found ${keysToDelete.length} ${childName} entries before key ${thresholdKey}`);

	if (!isDryRun) {
		// Use batch multi-path updates for much faster deletion
		// Firebase limits multi-path updates to ~1000 paths or 16MB payload
		const BATCH_SIZE = 500;
		const childRef = parentRef.child(childName);

		for (let i = 0; i < keysToDelete.length; i += BATCH_SIZE) {
			const batch = keysToDelete.slice(i, i + BATCH_SIZE);
			const updates: Record<string, null> = {};
			for (const key of batch) {
				updates[key] = null;
			}
			// biome-ignore lint/performance/noAwaitInLoops: batched processing requires sequential batches
			await childRef.update(updates);
		}
		verbose(`  Deleted ${keysToDelete.length} ${childName} entries`);
	}

	return keysToDelete.length;
};

/**
 * Prune old data from a single draft
 * @param firebasePath - Firebase path to the draft
 * @param pubId - Optional pub ID for release key lookup
 * @param preloadedReleaseKey - Pre-fetched release key (for batch processing efficiency)
 * @param label - Label for verbose logging (helps track logs during concurrent processing)
 * @param localStats - Optional local stats object to update (for thread-safe concurrent processing)
 */
const pruneDraft = async (
	firebasePath: string,
	pubId: string | null = null,
	preloadedReleaseKey: number | null = null,
	label: string = '',
	localStats: CleanupStats = stats,
): Promise<void> => {
	const prefix = label ? `[${label}] ` : '  ';
	const draftRef = getDatabaseRef(firebasePath);

	const latestCheckpointKey = await getLatestCheckpointKey(draftRef);

	if (latestCheckpointKey === null) {
		verbose(`${prefix}No checkpoint found, skipping pruning`);
		localStats.draftsSkipped++;
		return;
	}

	verbose(`${prefix}Latest checkpoint key: ${latestCheckpointKey}`);

	// Determine safe prune threshold: min(latestCheckpointKey, latestReleaseHistoryKey)
	// - We need changes from latestCheckpointKey onwards to reconstruct the doc
	// - We need changes from latestReleaseKey onwards to migrate discussions during release
	let pruneThreshold = latestCheckpointKey;

	// Use preloaded release key if available, otherwise fetch it
	const latestReleaseKey =
		preloadedReleaseKey ?? (pubId ? await getLatestReleaseHistoryKey(pubId) : null);
	if (latestReleaseKey !== null && latestReleaseKey < pruneThreshold) {
		verbose(
			`${prefix}Using release history key ${latestReleaseKey} (lower than checkpoint ${latestCheckpointKey})`,
		);
		pruneThreshold = latestReleaseKey;
	}

	verbose(`${prefix}Safe prune threshold: ${pruneThreshold}`);

	// Ensure there's a checkpoint at or before the prune threshold so we can reconstruct
	// all retained history. If not, create one at the prune threshold.
	const checkpointAtOrBefore = await getCheckpointKeyAtOrBefore(draftRef, pruneThreshold);
	if (checkpointAtOrBefore === null) {
		verbose(`${prefix}No checkpoint at or before ${pruneThreshold}, creating one...`);
		if (!isDryRun) {
			try {
				const { doc } = await getFirebaseDoc(draftRef, editorSchema, pruneThreshold);
				verbose(`${prefix}Doc size at key ${pruneThreshold}: ${doc.content.size} nodes`);
				// Get the timestamp from the change at this key
				const changeSnapshot = await draftRef
					.child(`changes/${pruneThreshold}`)
					.once('value');
				const change = changeSnapshot.val();
				const timestamp = change?.t ?? Date.now();
				// Store checkpoint with the original change's timestamp
				const compressedDoc = compressStateJSON({ doc: doc.toJSON() }).d;
				const checkpointSize = JSON.stringify(compressedDoc).length;
				verbose(
					`${prefix}Compressed checkpoint size: ${(checkpointSize / 1024).toFixed(1)} KB`,
				);
				const checkpoint = {
					d: compressedDoc,
					k: pruneThreshold,
					t: timestamp,
				};
				// Write all checkpoint data in a single multi-path update
				verbose(`${prefix}Writing checkpoint at key ${pruneThreshold}...`);
				await draftRef.update({
					[`checkpoints/${pruneThreshold}`]: checkpoint,
					checkpoint,
					[`checkpointMap/${pruneThreshold}`]: timestamp,
				});
				localStats.checkpointsCreated++;
				verbose(
					`${prefix}Created checkpoint at key ${pruneThreshold} with timestamp ${timestamp}`,
				);
			} catch (err) {
				const error = err as Error & { code?: string };
				const errorStr = `${error.code || ''} ${error.message || ''}`;
				log(`  Error during checkpoint creation: ${errorStr}`);
				if (errorStr.includes('WRITE_TOO_BIG') || errorStr.includes('write_too_big')) {
					// Doc is too large to write as a single checkpoint.
					// We can't safely prune without a checkpoint at the threshold,
					// so skip pruning this draft entirely.
					log(
						`  Warning: Doc too large to create checkpoint at ${pruneThreshold}, skipping prune for this draft`,
					);
					localStats.draftsSkipped++;
					return;
				} else {
					throw err;
				}
			}
		} else {
			verbose(`${prefix}Would create checkpoint at key ${pruneThreshold}`);
		}
	}

	// First, fast-forward any outdated discussions to the prune threshold
	const discussionsUpdated = await fastForwardDiscussions(draftRef, pruneThreshold);
	localStats.discussionsUpdated += discussionsUpdated;

	// Prune changes before the safe threshold
	localStats.changesDeleted += await pruneKeysBefore(draftRef, 'changes', pruneThreshold);

	// Prune merges before the safe threshold (legacy data)
	localStats.mergesDeleted += await pruneKeysBefore(draftRef, 'merges', pruneThreshold);

	// Prune checkpoints before the prune threshold (keep threshold checkpoint and any after)
	localStats.checkpointsDeleted += await pruneKeysBefore(draftRef, 'checkpoints', pruneThreshold);

	// Clean up checkpointMap entries for deleted checkpoints
	const checkpointMapSnapshot = await draftRef.child('checkpointMap').once('value');
	const checkpointMap = checkpointMapSnapshot.val();
	if (checkpointMap) {
		const oldMapKeys = Object.keys(checkpointMap).filter(
			(k) => parseInt(k, 10) < pruneThreshold,
		);
		if (oldMapKeys.length > 0 && !isDryRun) {
			// Use batch update for faster deletion
			const updates: Record<string, null> = {};
			for (const key of oldMapKeys) {
				updates[key] = null;
			}
			await draftRef.child('checkpointMap').update(updates);
			verbose(`${prefix}Cleaned up ${oldMapKeys.length} checkpointMap entries`);
		}
	}

	// Remove deprecated singular checkpoint if we have checkpoints/ entries
	if (!isDryRun) {
		const hasCheckpoints = (await draftRef.child('checkpoints').once('value')).exists();
		if (hasCheckpoints) {
			await draftRef.child('checkpoint').remove();
		}
	}
};

/**
 * Delete an orphaned draft from both Firebase and Postgres
 */
const deleteOrphanedDraft = async (draft: Draft): Promise<void> => {
	const { id, firebasePath } = draft;

	log(`  Deleting orphaned draft: ${id} (${firebasePath})`);

	if (!isDryRun) {
		// Delete from Firebase first
		const draftRef = getDatabaseRef(firebasePath);
		await draftRef.remove();

		// Then delete from Postgres
		await draft.destroy();
		stats.orphanedDraftsDeleted++;
	}
};

/**
 * Find all orphaned drafts (drafts without an associated Pub)
 */
const findOrphanedDrafts = async (): Promise<Draft[]> => {
	const orphanedDrafts = await sequelize.query<Draft>(
		`
		SELECT d.*
		FROM "Drafts" d
		LEFT JOIN "Pubs" p ON p."draftId" = d.id
		WHERE p.id IS NULL
		`,
		{
			model: Draft,
			mapToModel: true,
			type: QueryTypes.SELECT,
		},
	);
	return orphanedDrafts;
};

/**
 * Get all valid firebase paths from the database
 */
const getValidFirebasePaths = async (): Promise<Set<string>> => {
	const drafts = await Draft.findAll({
		attributes: ['firebasePath'],
	});
	return new Set(drafts.map((d) => d.firebasePath));
};

/**
 * Scan Firebase for orphaned top-level paths and delete them
 */
const cleanupOrphanedFirebasePaths = async (): Promise<void> => {
	log('Scanning Firebase for orphaned paths...');

	const validPaths = await getValidFirebasePaths();
	verbose(`  Found ${validPaths.size} valid paths in database`);

	// Check for orphaned paths under 'drafts/' prefix using shallow key listing
	const draftKeys = await getShallowKeys('drafts');
	verbose(`  Found ${draftKeys.length} keys under drafts/`);

	// Identify orphaned drafts
	const orphanedDraftKeys = draftKeys.filter((key) => !validPaths.has(`drafts/${key}`));
	stats.orphanedFirebasePathsFound += orphanedDraftKeys.length;
	if (orphanedDraftKeys.length > 0) {
		log(`  Found ${orphanedDraftKeys.length} orphaned draft paths`);
	}

	// Delete orphaned drafts with concurrency
	if (!isDryRun && orphanedDraftKeys.length > 0) {
		let deleted = 0;
		await runWithConcurrency(
			orphanedDraftKeys.map((draftKey) => async () => {
				await deleteFirebasePath(`drafts/${draftKey}`);
				deleted++;
				if (deleted % 100 === 0) {
					log(`  Deleted ${deleted}/${orphanedDraftKeys.length} orphaned drafts...`);
				}
			}),
			30,
		);
		stats.orphanedFirebasePathsDeleted += orphanedDraftKeys.length;
		log(`  Deleted ${orphanedDraftKeys.length} orphaned draft paths`);
	}

	// Check for orphaned 'pub-*' paths (legacy format) using shallow key listing
	const rootKeys = await getShallowKeys('');
	const legacyPubKeys = rootKeys.filter((key) => key.startsWith('pub-'));
	log(`  Found ${legacyPubKeys.length} legacy pub-* paths at root`);

	// Process legacy pubs in batches with concurrency for getShallowKeys
	interface LegacyPubInfo {
		pubKey: string;
		childKeys: string[];
		orphanedBranches: string[];
		hasValidBranch: boolean;
	}

	// Fetch all child keys with limited concurrency and progress logging
	let fetched = 0;
	const legacyPubInfos: LegacyPubInfo[] = await runWithConcurrency(
		legacyPubKeys.map((pubKey) => async () => {
			const childKeys = await getShallowKeys(pubKey);
			const branchKeys = childKeys.filter((k) => k.startsWith('branch-'));
			const orphanedBranches: string[] = [];
			let hasValidBranch = false;

			for (const branchKey of branchKeys) {
				const firebasePath = `${pubKey}/${branchKey}`;
				if (validPaths.has(firebasePath)) {
					hasValidBranch = true;
				} else {
					orphanedBranches.push(firebasePath);
				}
			}

			fetched++;
			if (fetched % 500 === 0) {
				log(`  Scanned ${fetched}/${legacyPubKeys.length} legacy pubs...`);
			}

			return { pubKey, childKeys, orphanedBranches, hasValidBranch };
		}),
		20,
	);

	// Collect all paths to delete
	const pathsToDelete: string[] = [];
	let metadataCount = 0;

	for (const info of legacyPubInfos) {
		if (!info.hasValidBranch) {
			// Delete entire pub
			pathsToDelete.push(info.pubKey);
			if (info.childKeys.includes('metadata')) {
				metadataCount++;
			}
		} else {
			// Delete only orphaned branches
			pathsToDelete.push(...info.orphanedBranches);
		}
	}

	stats.orphanedFirebasePathsFound += pathsToDelete.length;
	if (pathsToDelete.length > 0) {
		log(`  Found ${pathsToDelete.length} orphaned legacy paths to delete`);
	}

	// Delete all orphaned paths with concurrency
	if (!isDryRun && pathsToDelete.length > 0) {
		let deleted = 0;
		await runWithConcurrency(
			pathsToDelete.map((path) => async () => {
				await deleteFirebasePath(path);
				deleted++;
				if (deleted % 100 === 0) {
					log(`  Deleted ${deleted}/${pathsToDelete.length} legacy paths...`);
				}
			}),
			30,
		);
		stats.orphanedFirebasePathsDeleted += pathsToDelete.length;
		stats.metadataDeleted += metadataCount;
		log(`  Deleted ${pathsToDelete.length} orphaned legacy paths`);
	}

	log(`Found ${stats.orphanedFirebasePathsFound} orphaned Firebase paths`);
};

/**
 * Clean up orphaned branches and legacy metadata for a specific pub (legacy format only)
 * If the draft uses pub-{pubId}/branch-{branchId} format, delete any other branches
 * and the legacy metadata field at pub-{pubId}/metadata
 * @param localStats - Optional local stats object to update (for thread-safe concurrent processing)
 */
const cleanupOrphanedBranchesForPub = async (
	pubId: string,
	activePath: string,
	localStats: CleanupStats = stats,
): Promise<void> => {
	// Check if this is a legacy format path
	const legacyMatch = activePath.match(/^(pub-[^/]+)\/(branch-[^/]+)$/);
	if (!legacyMatch) {
		// New format (drafts/draft-xxx), no sibling branches to clean
		return;
	}

	const [, pubKey, activeBranchKey] = legacyMatch;
	verbose(`  Checking for orphaned branches under ${pubKey}`);

	const branchKeys = await getShallowKeys(pubKey);
	const orphanedBranches = branchKeys.filter(
		(key) => key.startsWith('branch-') && key !== activeBranchKey,
	);

	if (orphanedBranches.length > 0) {
		localStats.orphanedFirebasePathsFound += orphanedBranches.length;
		log(`  Found ${orphanedBranches.length} orphaned branches under ${pubKey}`);
		if (!isDryRun) {
			await runWithConcurrency(
				orphanedBranches.map((branchKey) => async () => {
					await deleteFirebasePath(`${pubKey}/${branchKey}`);
				}),
				30,
			);
			localStats.orphanedFirebasePathsDeleted += orphanedBranches.length;
		}
	}

	// Delete legacy metadata field at pub-{pubId}/metadata (no longer used in v6)
	const pubRef = getDatabaseRef(pubKey);
	const metadataSnapshot = await pubRef.child('metadata').once('value');
	if (metadataSnapshot.exists()) {
		verbose(`  Removing legacy metadata field at ${pubKey}/metadata`);
		if (!isDryRun) {
			await pubRef.child('metadata').remove();
			localStats.metadataDeleted++;
		}
	}
};

/**
 * Process a single pub's draft
 */
const processPubDraft = async (pubId: string): Promise<void> => {
	const pub = await Pub.findOne({
		where: { id: pubId },
		include: [{ model: Draft, as: 'draft' }],
	});

	if (!pub) {
		log(`Pub not found: ${pubId}`);
		return;
	}

	if (!pub.draft) {
		log(`Pub ${pubId} has no draft`);
		return;
	}

	log(`Processing pub ${pub.slug || pub.id}`);
	const pubLabel = pub.slug || pub.id.slice(0, 8);
	verbose(`[${pubLabel}] Draft path: ${pub.draft.firebasePath}`);

	try {
		await pruneDraft(pub.draft.firebasePath, pubId, null, pubLabel);
		await cleanupOrphanedBranchesForPub(pubId, pub.draft.firebasePath);
		stats.draftsProcessed++;
	} catch (err) {
		log(`  Error processing draft: ${(err as Error).message}`);
		stats.errorsEncountered++;
	}
};

/**
 * Process a single draft by ID
 */
const processDraftById = async (draftId: string): Promise<void> => {
	const draft = await Draft.findOne({ where: { id: draftId } });

	if (!draft) {
		log(`Draft not found: ${draftId}`);
		return;
	}

	// Try to find associated pub for release key lookup
	const pub = await Pub.findOne({ where: { draftId } });

	log(`Processing draft ${draftId}`);
	const draftLabel = draftId.slice(0, 8);
	verbose(`[${draftLabel}] Draft path: ${draft.firebasePath}`);

	try {
		await pruneDraft(draft.firebasePath, pub?.id ?? null, null, draftLabel);
		stats.draftsProcessed++;
	} catch (err) {
		log(`  Error processing draft: ${(err as Error).message}`);
		stats.errorsEncountered++;
	}
};

/**
 * Process all drafts in batches
 */
const processAllDrafts = async (): Promise<void> => {
	// First, handle orphaned drafts in Postgres
	log('Looking for orphaned drafts in Postgres...');
	const orphanedDrafts = await findOrphanedDrafts();
	stats.orphanedDraftsFound = orphanedDrafts.length;

	if (orphanedDrafts.length > 0) {
		log(`Found ${orphanedDrafts.length} orphaned drafts`);
		for (const draft of orphanedDrafts) {
			try {
				// biome-ignore lint/performance/noAwaitInLoops: intentionally sequential
				await deleteOrphanedDraft(draft);
			} catch (err) {
				log(`  Error deleting orphaned draft ${draft.id}: ${(err as Error).message}`);
				stats.errorsEncountered++;
			}
		}
	} else {
		log('No orphaned drafts found in Postgres');
	}

	// Scan Firebase for orphaned paths
	if (scanFirebase) {
		await cleanupOrphanedFirebasePaths();
	}

	// Then, prune old data from active drafts
	log('Pruning old data from active drafts...');

	// Get total count for progress
	const totalPubs = await Pub.count();
	log(`Found ${totalPubs} total pubs to process`);

	// Use a streaming worker pool approach: workers pull work as they finish
	// rather than waiting for entire batches to complete
	const WORKER_COUNT = 50;
	let nextOffset = 0;
	let allFetched = false;
	const pubQueue: Pub[] = [];
	const releaseKeyCache = new Map<string, number>();
	let activeFetches = 0;
	const PREFETCH_THRESHOLD = WORKER_COUNT * 2; // Keep queue filled

	// Function to prefetch more pubs if queue is running low
	const prefetchPubs = async () => {
		if (allFetched || activeFetches > 0 || pubQueue.length > PREFETCH_THRESHOLD) {
			return;
		}
		activeFetches++;
		try {
			const pubs = await Pub.findAll({
				attributes: ['id', 'slug'],
				include: [{ model: Draft, as: 'draft', attributes: ['id', 'firebasePath'] }],
				limit: batchSize,
				offset: nextOffset,
				order: [['id', 'ASC']],
			});

			if (pubs.length === 0) {
				allFetched = true;
			} else {
				// Prefetch release keys for this batch
				const pubIds = pubs.filter((p) => p.draft).map((p) => p.id);
				const releaseKeys = await batchGetLatestReleaseKeys(pubIds);
				for (const [pubId, key] of releaseKeys) {
					releaseKeyCache.set(pubId, key);
				}

				for (const pub of pubs) {
					if (pub.draft) {
						pubQueue.push(pub);
					}
				}
				nextOffset += pubs.length;

				if (pubs.length < batchSize) {
					allFetched = true;
				}
			}
		} finally {
			activeFetches--;
		}
	};

	// Initial prefetch
	await prefetchPubs();

	// Track total processed across all workers for progress logging
	let totalProcessed = 0;

	// Worker function that continuously processes pubs
	const workerWithStats = async (workerId: number, localStats: CleanupStats) => {
		while (true) {
			// Get next pub from queue
			const pub = pubQueue.shift();
			if (!pub) {
				if (allFetched) {
					return; // No more work
				}
				// Wait for more pubs to be fetched
				// biome-ignore lint/performance/noAwaitInLoops: intentional sleep while queue is empty
				await new Promise((r) => setTimeout(r, 50));
				continue;
			}

			// Trigger prefetch if queue is getting low
			if (pubQueue.length < PREFETCH_THRESHOLD && !allFetched) {
				prefetchPubs(); // Fire and forget
			}

			try {
				const pubLabel = pub.slug || pub.id.slice(0, 8);
				verbose(`[W${workerId}:${pubLabel}] Processing...`);
				const releaseKey = releaseKeyCache.get(pub.id) ?? null;
				await pruneDraft(pub.draft!.firebasePath, pub.id, releaseKey, pubLabel, localStats);
				await cleanupOrphanedBranchesForPub(pub.id, pub.draft!.firebasePath, localStats);
				localStats.draftsProcessed++;
				totalProcessed++;

				// Log progress every 500 processed (approximate due to concurrency)
				if (totalProcessed % 500 === 0) {
					log(`  Processed ~${totalProcessed}/${totalPubs} drafts...`);
				}
			} catch (err) {
				log(`  Error processing pub ${pub.id}: ${(err as Error).message}`);
				localStats.errorsEncountered++;
			}
		}
	};

	// Create per-worker stats to avoid race conditions
	const createLocalStats = (): CleanupStats => ({
		draftsProcessed: 0,
		draftsSkipped: 0,
		orphanedDraftsFound: 0,
		orphanedDraftsDeleted: 0,
		orphanedFirebasePathsFound: 0,
		orphanedFirebasePathsDeleted: 0,
		discussionsUpdated: 0,
		changesDeleted: 0,
		mergesDeleted: 0,
		checkpointsDeleted: 0,
		checkpointsCreated: 0,
		metadataDeleted: 0,
		errorsEncountered: 0,
	});

	const workerStats: CleanupStats[] = [];

	// Start workers with local stats
	const workers = Array.from({ length: WORKER_COUNT }, (_, i) => {
		const localStats = createLocalStats();
		workerStats.push(localStats);
		return workerWithStats(i, localStats);
	});
	await Promise.all(workers);

	// Aggregate worker stats into global stats
	for (const ws of workerStats) {
		stats.draftsProcessed += ws.draftsProcessed;
		stats.draftsSkipped += ws.draftsSkipped;
		stats.discussionsUpdated += ws.discussionsUpdated;
		stats.changesDeleted += ws.changesDeleted;
		stats.mergesDeleted += ws.mergesDeleted;
		stats.checkpointsDeleted += ws.checkpointsDeleted;
		stats.checkpointsCreated += ws.checkpointsCreated;
		stats.errorsEncountered += ws.errorsEncountered;
		stats.orphanedFirebasePathsFound += ws.orphanedFirebasePathsFound;
		stats.orphanedFirebasePathsDeleted += ws.orphanedFirebasePathsDeleted;
		stats.metadataDeleted += ws.metadataDeleted;
	}

	log(
		`  Processed ${stats.draftsProcessed} drafts total (${stats.changesDeleted} changes deleted)`,
	);
};

const printSummary = () => {
	log('=== Cleanup Summary ===');
	log(`Mode: ${isDryRun ? 'DRY RUN (no data deleted)' : 'EXECUTE'}`);
	log(`Drafts processed: ${stats.draftsProcessed}`);
	log(`Drafts skipped (no checkpoint): ${stats.draftsSkipped}`);
	log(`Orphaned drafts found (Postgres): ${stats.orphanedDraftsFound}`);
	log(`Orphaned drafts deleted: ${stats.orphanedDraftsDeleted}`);
	log(`Orphaned Firebase paths found: ${stats.orphanedFirebasePathsFound}`);
	log(`Orphaned Firebase paths deleted: ${stats.orphanedFirebasePathsDeleted}`);
	log(`Discussions fast-forwarded: ${stats.discussionsUpdated}`);
	log(`Changes deleted: ${stats.changesDeleted}`);
	log(`Merges deleted: ${stats.mergesDeleted}`);
	log(`Checkpoints created: ${stats.checkpointsCreated}`);
	log(`Checkpoints deleted: ${stats.checkpointsDeleted}`);
	log(`Metadata fields deleted: ${stats.metadataDeleted}`);
	log(`Errors encountered: ${stats.errorsEncountered}`);
};

const _postSummaryToSlack = async () => {
	if (isDryRun) return;

	const text = [
		'*Firebase Cleanup Completed*',
		`• Drafts processed: ${stats.draftsProcessed}`,
		`• Orphaned drafts deleted: ${stats.orphanedDraftsDeleted}`,
		`• Orphaned Firebase paths deleted: ${stats.orphanedFirebasePathsDeleted}`,
		`• Discussions fast-forwarded: ${stats.discussionsUpdated}`,
		`• Changes pruned: ${stats.changesDeleted}`,
		`• Merges pruned: ${stats.mergesDeleted}`,
		`• Checkpoints created: ${stats.checkpointsCreated}`,
		`• Checkpoints pruned: ${stats.checkpointsDeleted}`,
		`• Metadata fields deleted: ${stats.metadataDeleted}`,
		stats.errorsEncountered > 0 ? `• ⚠️ Errors: ${stats.errorsEncountered}` : '',
	]
		.filter(Boolean)
		.join('\n');

	try {
		await postToSlack({ text, icon_emoji: ':broom:' });
	} catch (err) {
		log(`Failed to post to Slack: ${(err as Error).message}`);
	}
};

const main = async () => {
	log('Starting Firebase cleanup');
	log(`Mode: ${isDryRun ? 'DRY RUN' : 'EXECUTE'}`);

	try {
		if (pubId) {
			await processPubDraft(pubId);
		} else if (draftId) {
			await processDraftById(draftId);
		} else {
			await processAllDrafts();
		}

		printSummary();
		// await postSummaryToSlack();
	} catch (err) {
		log(`Fatal error: ${(err as Error).message}`);
		console.error(err);
		process.exit(1);
	}
};

main().finally(() => process.exit(0));
