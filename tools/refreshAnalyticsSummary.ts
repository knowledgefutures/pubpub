/**
 * Create or refresh the analytics summary materialized views.
 *
 * Usage:
 *   pnpm run tools refreshAnalyticsSummary          # create + refresh
 *   pnpm run tools refreshAnalyticsSummary refresh   # refresh only
 */
import { createSummaryViews, refreshSummaryViews } from 'server/analytics/summaryViews';

// eslint-disable-next-line no-console
const log = (msg: string) => console.info(`[refreshAnalyticsSummary] ${msg}`);

async function main() {
	const refreshOnly = process.argv[3] === 'refresh';

	if (!refreshOnly) {
		log('creating materialized views (if not exist)...');
		await createSummaryViews();
		log('views created.');
	}

	log('refreshing materialized views (CONCURRENTLY)...');
	const t0 = Date.now();
	await refreshSummaryViews();
	const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
	log(`refresh complete in ${elapsed}s.`);
}

main()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error('[refreshAnalyticsSummary] FATAL:', err);
		process.exit(1);
	});
