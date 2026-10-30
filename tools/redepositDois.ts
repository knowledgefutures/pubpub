/**
 * Redeposit a community's existing DOIs with Crossref, rebuilt from current data.
 *
 *   npm run tools redepositDois -- --subdomain hdsr --dry-run      # list what would be sent
 *   npm run tools redepositDois -- --subdomain hdsr --pub mix9b32x # one pub, to check the result
 *   npm run tools redepositDois -- --subdomain hdsr --limit 5      # first five pubs
 *   npm run tools redepositDois -- --subdomain hdsr                # everything
 *
 * The same run is available from the superadmin dashboard (DOI Redeposit tab), where it runs as a
 * worker task. Results are written to redeposit-<subdomain>-<timestamp>.json.
 */
import fs from 'fs';
import path from 'path';

import { getRedepositPlan, runRedeposit } from 'server/doi/redeposit';
import { Community } from 'server/models';

const getArgValue = (flag: string) => {
	const idx = process.argv.indexOf(flag);
	return idx !== -1 ? process.argv[idx + 1] : undefined;
};

const log = (msg: string) => console.log(`[redeposit] ${msg}`);

const main = async () => {
	const subdomain = getArgValue('--subdomain');
	const pubSlug = getArgValue('--pub');
	const limitArg = getArgValue('--limit');
	const limit = limitArg ? Number(limitArg) : undefined;
	const dryRun = process.argv.includes('--dry-run');

	if (!subdomain) {
		throw new Error('--subdomain is required');
	}
	if (limitArg && !(limit! > 0)) {
		throw new Error('--limit must be a positive number');
	}

	const community = await Community.findOne({ where: { subdomain }, attributes: ['id'] });
	if (!community) {
		throw new Error(`No community with subdomain ${subdomain}`);
	}

	const plan = await getRedepositPlan(community.id, { pubSlug, limit });
	const collectionCount = plan.items.filter((item) => item.kind === 'collection').length;
	log(`${plan.community.title} (${subdomain}), DOI prefix ${plan.doiPrefix ?? 'default'}`);
	log(`community ISSN: ${plan.community.issn ?? 'none set'}`);
	log(
		`${plan.items.length} to deposit: ${collectionCount} collections, ${plan.items.length - collectionCount} pubs`,
	);
	log(
		`skipped: ${plan.skipped.pubsWithoutDepositRecord} pubs with a DOI but no deposit record, ${plan.skipped.pubsWithoutRelease} without a release`,
	);

	if (dryRun) {
		for (const item of plan.items) {
			log(`  [dry-run] ${item.kind} ${item.doi} "${item.title}"`);
		}
		process.exit(0);
	}

	const summary = await runRedeposit(plan, {
		onProgress: (progress, result) => {
			const status = result.ok ? 'ok' : `FAILED: ${result.error}`;
			log(`  ${progress.processed}/${progress.total} ${result.doi} ${status}`);
		},
	});

	const outputPath = path.resolve(`redeposit-${subdomain}-${Date.now()}.json`);
	fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
	log(`${summary.succeeded} deposited, ${summary.failed} failed. Results in ${outputPath}`);
	log('Crossref processes deposits asynchronously; check api.crossref.org/works/<doi> shortly.');
	process.exit(summary.failed > 0 ? 1 : 0);
};

main().catch((e) => {
	console.error(`[redeposit] fatal: ${e.message}`);
	process.exit(1);
});
