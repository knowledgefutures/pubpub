import * as Sentry from '@sentry/node';
import { Op } from 'sequelize';

import { UnderlayIntegration } from 'server/models';
import { addWorkerTask } from 'server/utils/workers';

/**
 * Enqueue an Underlay push for every integration whose automatic schedule is due.
 *
 * Cron schedules this daily; the tool only DECIDES what is due and enqueues a `pushToUnderlay`
 * worker task per community. The worker (with its long timeout) does the heavy lifting — this
 * process stays cheap. An integration is due when it has a `scheduleDays` cadence and either has
 * never pushed or last pushed at least `scheduleDays` ago.
 */
const isDue = (integration: UnderlayIntegration, now: number): boolean => {
	if (!integration.scheduleDays || integration.scheduleDays <= 0) {
		return false;
	}
	if (!integration.lastPushedAt) {
		return true;
	}
	const dueAt =
		new Date(integration.lastPushedAt).getTime() +
		integration.scheduleDays * 24 * 60 * 60 * 1000;
	return dueAt <= now;
};

async function main() {
	const now = Date.now();
	// Only integrations that are fully configured and on a schedule can be due.
	const integrations = await UnderlayIntegration.findAll({
		where: {
			scheduleDays: { [Op.ne]: null },
			communityId: { [Op.ne]: null },
			underlayOrg: { [Op.ne]: null },
			underlayCollection: { [Op.ne]: null },
			apiKey: { [Op.ne]: null },
			apiKeyInitVec: { [Op.ne]: null },
		},
	});

	let enqueued = 0;
	for (const integration of integrations) {
		if (!integration.communityId || !isDue(integration, now)) {
			continue;
		}
		try {
			// biome-ignore lint/performance/noAwaitInLoops: enqueue sequentially, bounded by scheduled integrations
			await addWorkerTask({
				type: 'pushToUnderlay',
				input: { communityId: integration.communityId },
			});
			enqueued += 1;
			console.log(`Enqueued Underlay push for community ${integration.communityId}`);
		} catch (err) {
			console.error(
				`Failed to enqueue Underlay push for community ${integration.communityId}:`,
				err,
			);
			Sentry.captureException(err);
		}
	}
	console.log(
		`Enqueued ${enqueued} Underlay push task(s) of ${integrations.length} scheduled integration(s).`,
	);
}

let exitCode = 0;
main()
	.then(() => {
		console.info('Done!');
	})
	.catch((err) => {
		console.error('Failed!');
		console.error(err);
		exitCode = 1;
	})
	.finally(() => process.exit(exitCode));
