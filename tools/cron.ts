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
	cron.schedule('0 */6 * * *', () => run('Backup DB', 'tools-prod backupDb'), {
		timezone: 'UTC',
	}); // Every 6 hours
	cron.schedule('0 5 * * *', () => run('Email Digest', 'tools-prod emailActivityDigest'), {
		timezone: 'UTC',
	});
} else {
	log(
		'PUBPUB_PRODUCTION is not set — no jobs registered. Run tasks manually with: pnpm run tools-prod <task>',
	);
}

log('Scheduler started');
