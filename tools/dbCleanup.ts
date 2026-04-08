/**
 * Database cleanup tool — removes stale rows from WorkerTasks and Signups.
 *
 * Usage:
 *   pnpm run tools-prod dbCleanup              # dry-run (prints counts, deletes nothing)
 *   pnpm run tools-prod dbCleanup --execute    # actually deletes rows
 */
import { Op } from 'sequelize';

import { Signup, WorkerTask } from 'server/models';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const execute = process.argv.includes('--execute');

const log = (msg: string) => console.log(`[dbCleanup] ${msg}`);

async function cleanupWorkerTasks() {
	const cutoff = new Date(Date.now() - THIRTY_DAYS_MS);

	// Count what we'd delete: all non-archive tasks older than 30 days
	const count = await WorkerTask.count({
		where: {
			type: { [Op.ne]: 'archive' },
			createdAt: { [Op.lt]: cutoff },
		},
	});

	log(`WorkerTasks to delete (non-archive, older than 30d): ${count}`);

	if (execute && count > 0) {
		const deleted = await WorkerTask.destroy({
			where: {
				type: { [Op.ne]: 'archive' },
				createdAt: { [Op.lt]: cutoff },
			},
		});
		log(`WorkerTasks deleted: ${deleted}`);
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

	log(`Signups to delete (completed, older than 7d): ${completedCount}`);
	log(`Signups to delete (incomplete/abandoned, older than 30d): ${abandonedCount}`);

	if (execute) {
		if (completedCount > 0) {
			const deleted = await Signup.destroy({
				where: {
					completed: true,
					updatedAt: { [Op.lt]: sevenDaysAgo },
				},
			});
			log(`Completed signups deleted: ${deleted}`);
		}

		if (abandonedCount > 0) {
			const deleted = await Signup.destroy({
				where: {
					[Op.or]: [{ completed: false }, { completed: null }],
					createdAt: { [Op.lt]: thirtyDaysAgo },
				},
			});
			log(`Abandoned signups deleted: ${deleted}`);
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
