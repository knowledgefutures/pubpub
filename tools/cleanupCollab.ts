/**
 * Collab Cleanup Tool
 *
 * Maintains the CollabCommit and DraftCheckpoint tables:
 * 1. Checkpoints stale drafts (not edited within threshold) and wipes their commits
 * 2. Truncates old commits for active drafts as a safety net
 * 3. Deletes orphaned drafts (no associated Pub)
 *
 * Usage:
 *   pnpm run tools cleanupCollab                     # dry run, all drafts
 *   pnpm run tools cleanupCollab --execute            # actually delete data
 *   pnpm run tools cleanupCollab --pubId=<uuid>       # test on single pub
 *   pnpm run tools cleanupCollab --daysOld=60         # custom staleness threshold
 */

import { Op, QueryTypes } from 'sequelize';

import { replayCommitsOntoDoc } from 'server/collab/replay';
import { upsertDraftCheckpoint } from 'server/draftCheckpoint/queries';
import { CollabCommit, Draft, DraftCheckpoint } from 'server/models';
import { sequelize } from 'server/sequelize';

const {
	argv: { execute, pubId: specificPubId, daysOld: daysOldArg = 30, verbose: verboseFlag },
} = require('yargs');

const isDryRun = !execute;
const DAYS_OLD = Number(daysOldArg);
const CHECKPOINT_BUFFER = 50;

// biome-ignore lint/suspicious/noConsole: CLI tool output
const log = (msg: string) => console.log(`[collab-cleanup] ${new Date().toISOString()} ${msg}`);
const verbose = (msg: string) => verboseFlag && log(msg);

interface Stats {
	staleDraftsCheckpointed: number;
	staleCommitsDeleted: number;
	activeCommitsTruncated: number;
	orphanedDraftsDeleted: number;
	errorsEncountered: number;
}

const stats: Stats = {
	staleDraftsCheckpointed: 0,
	staleCommitsDeleted: 0,
	activeCommitsTruncated: 0,
	orphanedDraftsDeleted: 0,
	errorsEncountered: 0,
};

/**
 * For stale drafts whose checkpoint is behind Draft.version, replay outstanding
 * commits onto the checkpoint doc to bring it up to date, then delete all commits.
 */
const checkpointStaleDrafts = async () => {
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - DAYS_OLD);

	log(`Checkpointing stale drafts (not edited since ${cutoff.toISOString()})...`);

	type StaleDraft = { draftId: string; version: number; checkpointKey: number | null };

	const where = specificPubId
		? `AND p.id = :pubId`
		: `AND (d."latestKeyAt" IS NULL OR d."latestKeyAt" < :cutoff)`;

	const staleDrafts = await sequelize.query<StaleDraft>(
		`
		SELECT d.id AS "draftId", d.version, dc."historyKey" AS "checkpointKey"
		FROM "Drafts" d
		INNER JOIN "Pubs" p ON p."draftId" = d.id
		LEFT JOIN "DraftCheckpoints" dc ON dc."draftId" = d.id
		WHERE d.version > COALESCE(dc."historyKey", 0)
		${where}
		ORDER BY d."latestKeyAt" ASC NULLS FIRST
		`,
		{
			replacements: { cutoff: cutoff.toISOString(), pubId: specificPubId },
			type: QueryTypes.SELECT,
		},
	);

	log(`  Found ${staleDrafts.length} stale drafts needing checkpoint`);

	for (const { draftId, version, checkpointKey } of staleDrafts) {
		try {
			const fromVersion = checkpointKey ?? 0;

			// biome-ignore lint/performance/noAwaitInLoops: sequential to avoid overwhelming the DB
			const [checkpoint, commits] = await Promise.all([
				DraftCheckpoint.findOne({ where: { draftId } }),
				CollabCommit.findAll({
					where: { draftId, version: { [Op.gt]: fromVersion, [Op.lte]: version } },
					order: [['version', 'ASC']],
				}),
			]);

			if (commits.length === 0) {
				verbose(`  [${draftId.slice(0, 8)}] no commits to replay, skipping`);
				continue;
			}

			const baseDoc = checkpoint?.doc ?? { type: 'doc', content: [{ type: 'paragraph' }] };
			const reconstructed = replayCommitsOntoDoc(baseDoc, commits);

			verbose(
				`  [${draftId.slice(0, 8)}] replaying ${commits.length} commits (${fromVersion} -> ${version})`,
			);

			if (!isDryRun) {
				await sequelize.transaction(async (tr) => {
					await upsertDraftCheckpoint(
						draftId,
						version,
						reconstructed.toJSON() as any,
						Date.now(),
						tr,
					);

					await CollabCommit.destroy({
						where: { draftId },
						transaction: tr,
					});
				});
			}

			stats.staleDraftsCheckpointed++;
			stats.staleCommitsDeleted += commits.length;
		} catch (err) {
			log(`  Error checkpointing draft ${draftId}: ${(err as Error).message}`);
			stats.errorsEncountered++;
		}
	}
};

/**
 * For active drafts, delete commits well below the checkpoint version.
 * This catches any leftovers the real-time truncation in authority.ts missed.
 */
const truncateActiveCommits = async () => {
	log('Truncating old commits for active drafts...');

	// single bulk query: delete commits where version < (checkpoint.historyKey - buffer)
	const [results] = await sequelize.query<{ deleted: string }>(
		isDryRun
			? `
			SELECT COUNT(*) AS deleted
			FROM "CollabCommits" cc
			INNER JOIN "DraftCheckpoints" dc ON dc."draftId" = cc."draftId"
			WHERE cc.version < dc."historyKey" - :buffer
			  AND dc."historyKey" > :buffer
			`
			: `
			DELETE FROM "CollabCommits" cc
			USING "DraftCheckpoints" dc
			WHERE dc."draftId" = cc."draftId"
			  AND cc.version < dc."historyKey" - :buffer
			  AND dc."historyKey" > :buffer
			RETURNING cc.id
			`,
		{
			replacements: { buffer: CHECKPOINT_BUFFER },
			type: QueryTypes.SELECT,
		},
	);

	const totalDeleted = isDryRun
		? parseInt((results as any)?.deleted ?? '0', 10)
		: (results as any[]).length;

	stats.activeCommitsTruncated = totalDeleted;
	log(`  ${isDryRun ? 'Would truncate' : 'Truncated'} ${totalDeleted} old commits`);
};

/**
 * Find drafts with no associated Pub and delete them (cascades to commits and checkpoints).
 */
const deleteOrphanedDrafts = async () => {
	log('Looking for orphaned drafts...');

	const orphaned = await sequelize.query<{ id: string }>(
		`
		SELECT d.id
		FROM "Drafts" d
		LEFT JOIN "Pubs" p ON p."draftId" = d.id
		WHERE p.id IS NULL
		`,
		{ type: QueryTypes.SELECT },
	);

	log(`  Found ${orphaned.length} orphaned drafts`);

	if (orphaned.length === 0) {
		return;
	}

	if (!isDryRun) {
		const ids = orphaned.map((d) => d.id);

		await CollabCommit.destroy({ where: { draftId: { [Op.in]: ids } } });
		await DraftCheckpoint.destroy({ where: { draftId: { [Op.in]: ids } } });
		await Draft.destroy({ where: { id: { [Op.in]: ids } } });
	}

	stats.orphanedDraftsDeleted = orphaned.length;
};

const printSummary = () => {
	log('=== Cleanup Summary ===');
	log(`Mode: ${isDryRun ? 'DRY RUN (no data changed)' : 'EXECUTE'}`);
	log(`Stale drafts checkpointed: ${stats.staleDraftsCheckpointed}`);
	log(`Stale commits deleted: ${stats.staleCommitsDeleted}`);
	log(`Active commits truncated: ${stats.activeCommitsTruncated}`);
	log(`Orphaned drafts deleted: ${stats.orphanedDraftsDeleted}`);
	log(`Errors encountered: ${stats.errorsEncountered}`);
};

const main = async () => {
	log('Collab Cleanup Tool');
	log(`Mode: ${isDryRun ? 'DRY RUN' : 'EXECUTE'}`);
	log(`Staleness threshold: ${DAYS_OLD} days`);

	if (specificPubId) {
		log(`Target: single pub ${specificPubId}`);
	}

	log('');

	try {
		await checkpointStaleDrafts();
		await truncateActiveCommits();

		if (!specificPubId) {
			await deleteOrphanedDrafts();
		}

		printSummary();
	} catch (err) {
		log(`Fatal error: ${(err as Error).message}`);
		console.error(err);
		process.exit(1);
	}
};

main().finally(() => process.exit(0));
