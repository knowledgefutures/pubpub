/**
 * Database cleanup tool — removes stale rows from WorkerTasks and Signups.
 *
 * Usage:
 *   pnpm run tools-prod dbCleanup              # dry-run (prints counts, deletes nothing)
 *   pnpm run tools-prod dbCleanup --execute    # actually deletes rows
 */
import { Op } from 'sequelize';

import { Signup, WorkerTask } from 'server/models';
import { sequelize } from 'server/sequelize';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const BATCH_SIZE = 10_000;

const execute = process.argv.includes('--execute');

const log = (msg: string) => console.log(`[dbCleanup] ${msg}`);

/**
 * Delete rows matching a raw WHERE clause in batches to avoid locking the
 * table with a single enormous transaction.  Uses
 *   DELETE … WHERE id IN (SELECT id … LIMIT)
 * which is compatible with PostgreSQL.
 */
async function destroyInBatches(
	tableName: string,
	whereClause: string,
	replacements: Record<string, unknown>,
	totalCount: number,
) {
	let totalDeleted = 0;

	// eslint-disable-next-line no-constant-condition
	while (true) {
		// biome-ignore lint/performance/noAwaitInLoops: intentional sequential batching to limit DB load
		const [, meta] = await sequelize.query(
			`DELETE FROM "${tableName}"
			 WHERE id IN (
			   SELECT id FROM "${tableName}"
			   WHERE ${whereClause}
			   LIMIT :batchSize
			 )`,
			{ replacements: { ...replacements, batchSize: BATCH_SIZE } },
		);

		const deletedInBatch = (meta as any)?.rowCount ?? 0;
		totalDeleted += deletedInBatch;

		log(`  … deleted ${totalDeleted.toLocaleString()} / ${totalCount.toLocaleString()}`);

		if (deletedInBatch < BATCH_SIZE) {
			break;
		}
	}

	return totalDeleted;
}

async function cleanupWorkerTasks() {
	const cutoff = new Date(Date.now() - THIRTY_DAYS_MS);

	// Count what we'd delete: all non-archive tasks older than 30 days
	const count = await WorkerTask.count({
		where: {
			type: { [Op.ne]: 'archive' },
			createdAt: { [Op.lt]: cutoff },
		},
	});

	log(`WorkerTasks to delete (non-archive, older than 30d): ${count.toLocaleString()}`);

	if (execute && count > 0) {
		const deleted = await destroyInBatches(
			'WorkerTasks',
			`"type" != 'archive' AND "createdAt" < :cutoff`,
			{ cutoff },
			count,
		);
		log(`WorkerTasks deleted: ${deleted.toLocaleString()}`);
	}
}

async function cleanupSignups() {
	const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS);
	const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS);

	// Count completed signups older than 7 days
	const completedCount = await Signup.count({
		where: {
			completed: true,
			updatedAt: { [Op.lt]: sevenDaysAgo },
		},
	});

	// Count incomplete signups older than 30 days (abandoned)
	const abandonedCount = await Signup.count({
		where: {
			[Op.or]: [{ completed: false }, { completed: null }],
			createdAt: { [Op.lt]: thirtyDaysAgo },
		},
	});

	log(`Signups to delete (completed, older than 7d): ${completedCount.toLocaleString()}`);
	log(
		`Signups to delete (incomplete/abandoned, older than 30d): ${abandonedCount.toLocaleString()}`,
	);

	if (execute) {
		if (completedCount > 0) {
			const deleted = await destroyInBatches(
				'Signups',
				`"completed" = true AND "updatedAt" < :cutoff`,
				{ cutoff: sevenDaysAgo },
				completedCount,
			);
			log(`Completed signups deleted: ${deleted.toLocaleString()}`);
		}

		if (abandonedCount > 0) {
			const deleted = await destroyInBatches(
				'Signups',
				`("completed" = false OR "completed" IS NULL) AND "createdAt" < :cutoff`,
				{ cutoff: thirtyDaysAgo },
				abandonedCount,
			);
			log(`Abandoned signups deleted: ${deleted.toLocaleString()}`);
		}
	}
}

async function main() {
	if (!execute) {
		log('DRY RUN — pass --execute to actually delete rows');
	}

	await cleanupWorkerTasks();
	await cleanupSignups();

	if (!execute) {
		log('DRY RUN complete — no rows were deleted');
	} else {
		log('Cleanup complete');
	}

	process.exit(0);
}

main().catch((err) => {
	console.error('[dbCleanup] Fatal error:', err);
	process.exit(1);
});
