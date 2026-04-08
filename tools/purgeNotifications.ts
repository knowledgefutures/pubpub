/**
 * Notification Purge Tool
 *
 * Deletes old UserNotification rows to keep the table bounded.
 * Notifications are ephemeral — once read, they have little long-term value.
 *
 * Default retention: 730 days (≈2 years). The purge runs in batches to avoid
 * locking the table for extended periods.
 *
 * Usage:
 *   pnpm run tools-prod purgeNotifications                     # Dry run, default 180 days
 *   pnpm run tools-prod purgeNotifications --execute           # Actually delete
 *   pnpm run tools-prod purgeNotifications --execute --days=90 # Custom retention
 *   pnpm run tools-prod purgeNotifications --execute --batchSize=50000
 *   pnpm run tools-prod purgeNotifications --verbose           # Show per-batch details
 */

import { QueryTypes } from 'sequelize';

import { UserNotification } from 'server/models';
import { sequelize } from 'server/sequelize';

const {
	argv: { execute, days: daysArg = 730, batchSize: batchSizeArg = 10000, verbose: verboseFlag },
} = require('yargs');

const isDryRun = !execute;
const RETENTION_DAYS = Number(daysArg);
const BATCH_SIZE = Number(batchSizeArg);

// biome-ignore lint/suspicious/noConsole: CLI tool output
const log = (msg: string) =>
	console.log(`[purge-notifications] ${new Date().toISOString()} ${msg}`);
const verbose = (msg: string) => verboseFlag && log(msg);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

	log(
		`Retention: ${RETENTION_DAYS} days — purging notifications created before ${cutoffDate.toISOString()}`,
	);
	log(`Batch size: ${BATCH_SIZE.toLocaleString()}`);

	if (isDryRun) {
		log('DRY RUN — pass --execute to actually delete rows');
	}

	// Count how many rows would be affected
	const [countResult] = await sequelize.query<{ count: string }>(
		`SELECT COUNT(*) AS count FROM "UserNotifications" WHERE "createdAt" < :cutoff`,
		{ replacements: { cutoff: cutoffDate }, type: QueryTypes.SELECT },
	);
	const totalEligible = Number(countResult.count);

	log(`Found ${totalEligible.toLocaleString()} notifications older than ${RETENTION_DAYS} days`);

	if (totalEligible === 0) {
		log('Nothing to purge');
		process.exit(0);
	}

	if (isDryRun) {
		// Show a breakdown by read/unread for context
		const [breakdown] = await sequelize.query<{ is_read: boolean; count: string }>(
			`SELECT "isRead" AS is_read, COUNT(*) AS count
			 FROM "UserNotifications"
			 WHERE "createdAt" < :cutoff
			 GROUP BY "isRead"`,
			{ replacements: { cutoff: cutoffDate }, type: QueryTypes.SELECT },
		);
		const rows = Array.isArray(breakdown) ? breakdown : [breakdown];
		for (const row of rows) {
			const label = row.is_read ? 'read' : 'unread';
			log(`  ${label}: ${Number(row.count).toLocaleString()}`);
		}

		log('Dry run complete — no rows deleted');
		process.exit(0);
	}

	// Batched delete loop
	let totalDeleted = 0;
	let batchNumber = 0;

	// eslint-disable-next-line no-constant-condition
	while (true) {
		batchNumber++;
		// biome-ignore lint/performance/noAwaitInLoops: intentional sequential batching to limit DB load
		const [, meta] = await sequelize.query(
			`DELETE FROM "UserNotifications"
			 WHERE id IN (
			   SELECT id FROM "UserNotifications"
			   WHERE "createdAt" < :cutoff
			   LIMIT :batchSize
			 )`,
			{ replacements: { cutoff: cutoffDate, batchSize: BATCH_SIZE } },
		);

		const deletedInBatch = (meta as any)?.rowCount ?? 0;
		totalDeleted += deletedInBatch;

		verbose(
			`Batch ${batchNumber}: deleted ${deletedInBatch.toLocaleString()} (total: ${totalDeleted.toLocaleString()})`,
		);

		if (deletedInBatch < BATCH_SIZE) {
			break;
		}

		// Brief pause between batches to reduce load
		await sleep(500);
	}

	log(
		`Purge complete: deleted ${totalDeleted.toLocaleString()} notifications in ${batchNumber} batch(es)`,
	);
	process.exit(0);
};

main().catch((err) => {
	log(`Fatal error: ${err.message}`);
	console.error(err);
	process.exit(1);
});
