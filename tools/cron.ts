import { execSync } from 'child_process';
import cron from 'node-cron';

const log = (msg: string) => console.log(`[cron] ${new Date().toISOString()} ${msg}`);

function run(name: string, script: string) {
	log(`Starting: ${name}`);
	try {
		execSync(`pnpm run ${script}`, { stdio: 'inherit' });
		log(`Completed: ${name}`);
	} catch (err) {
		const error = err as Error;
		const details =
			error && error.stack
				? error.stack
				: typeof err === 'string'
					? err
					: JSON.stringify(err);
		log(`Failed: ${name} — ${error.message}`);
		log(`Failure details for ${name}: ${details}`);
	}
}

if (process.env.PUBPUB_PRODUCTION === 'true') {
	cron.schedule('0 */12 * * *', () => run('Backup DB', 'tools-prod backupDb'), {
		timezone: 'UTC',
	}); // Every 6 hours

	cron.schedule('0 13 * * *', () => run('Email Digest', 'tools-prod emailActivityDigest'), {
		timezone: 'UTC',
	});

	cron.schedule(
		'0 2 * * 0',
		() => run('Purge Notifications', 'tools-prod purgeNotifications --execute'),
		{
			timezone: 'UTC',
		},
	); // Weekly on Sunday at 2 AM UTC

	cron.schedule('0 3 * * 0', () => run('DB Cleanup', 'tools-prod dbCleanup --execute'), {
		timezone: 'UTC',
	}); // Weekly on Sunday at 3 AM UTC

	cron.schedule(
		'0 5 * * 0',
		() => run('Collab Cleanup', 'tools-prod cleanupCollab --execute'),
		{
			timezone: 'UTC',
		},
	); // Weekly on Sunday at 5 AM UTC

	cron.schedule(
		'30 3 * * *',
		() => run('Refresh Analytics Matviews', 'tools-prod refreshAnalyticsSummary refresh'),
		{ timezone: 'UTC' },
	); // Daily at 3:30 AM UTC (before spam scan)

	cron.schedule('0 7 1 */6 *', () => run('S3 Cleanup', 'tools-prod s3Cleanup --tag'), {
		timezone: 'UTC',
	}); // Every 6 months (1st of Jan & Jul) at 7 AM UTC

	cron.schedule(
		'0 4 * * *',
		() => {
			const dateStamp = new Date().toISOString().slice(0, 10);
			const commentsPath = `/tmp/spam-scan-comments-${dateStamp}.json`;
			const accountsPath = `/tmp/spam-scan-accounts-${dateStamp}.json`;
			const outputPath = `/tmp/spam-scan-${dateStamp}.json`;

			// primary: scan users who commented in the last 72h (catches active
			// spammers regardless of account age)
			run(
				'Spam Scan (analyze recent commenters)',
				`tools-prod scanSpamUsers --analyze --mode recent-comments --since 72h --skip-profile-signals --output ${commentsPath} --min-score 6`,
			);

			run(
				'Spam Scan (execute recent commenters)',
				`tools-prod scanSpamUsers --execute --input ${commentsPath} --ban --min-score 6`,
			);

			// secondary: scan newly created accounts (catches seo-only accounts
			// that haven't commented yet). skip users already caught above.
			run(
				'Spam Scan (analyze new accounts)',
				`tools-prod scanSpamUsers --analyze --since 72h --output ${accountsPath} --input ${commentsPath} --min-score 8`,
			);

			run(
				'Spam Scan (execute new accounts)',
				`tools-prod scanSpamUsers --execute --input ${accountsPath} --ban --min-score 8`,
			);

			// merge the two results into a single file using jq
			run(
				'Spam Scan (merge results)',
				`jq -s '[.[]]' ${commentsPath} ${accountsPath} > ${outputPath}`,
			);
			run('Spam Scan (report)', `tools-prod scanSpamUsers --report --input ${outputPath}`);
		},
		{ timezone: 'UTC' },
	); // Daily at 4 AM UTC
} else {
	const logNotSet = () => {
		log(
			'PUBPUB_PRODUCTION is not set — no jobs registered. Run tasks manually with: pnpm run tools-prod <task>',
		);
	};
	logNotSet();
	cron.schedule('0 0 * * *', logNotSet, {
		timezone: 'UTC',
	});
}

log('Scheduler started');
