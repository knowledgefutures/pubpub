/**
 * Redeposit a community's existing DOIs with Crossref, rebuilt from current data.
 *
 *   npm run tools redepositDois -- --subdomain hdsr --check        # run every check, send nothing
 *   npm run tools redepositDois -- --subdomain hdsr --pub mix9b32x # one pub, to check the result
 *   npm run tools redepositDois -- --subdomain hdsr --limit 5      # first five pubs
 *   npm run tools redepositDois -- --subdomain hdsr                # everything
 *
 * Each item is checked just before it is sent and skipped, with the reason, if the redeposit would
 * change more than its metadata. After sending, Crossref's submission log is read for each deposit.
 * The same run is available from the superadmin dashboard (DOI Redeposit tab), and a CLI run shows
 * up there too. Results are written to redeposit-<subdomain>-<timestamp>.json.
 */
import fs from 'fs';
import path from 'path';

import { getRedepositPlan, RedepositError } from 'server/doi/redeposit';
import { Community, WorkerTask } from 'server/models';
import { redepositDoisTask } from 'workers/tasks/redepositDois';

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
	const checkOnly = process.argv.includes('--check') || process.argv.includes('--dry-run');

	if (!subdomain) {
		throw new RedepositError('--subdomain is required');
	}
	if (limitArg && !(limit! > 0)) {
		throw new RedepositError('--limit must be a positive number');
	}

	const community = await Community.findOne({ where: { subdomain }, attributes: ['id'] });
	if (!community) {
		throw new RedepositError(`No community with subdomain ${subdomain}`);
	}
	const running = await WorkerTask.findOne({
		where: { type: 'redepositDois', input: { communityId: community.id }, isProcessing: true },
	});
	if (running) {
		throw new RedepositError(
			`A redeposit is already running for ${subdomain} (${running.id}).`,
		);
	}

	const plan = await getRedepositPlan(community.id, { pubSlug, limit });
	const collectionCount = plan.items.filter((item) => item.kind === 'collection').length;
	log(`${plan.community.title} (${subdomain})`);
	log(`sending to ${plan.submissionHost ?? 'unknown host'} with DOI prefix ${plan.doiPrefix}`);
	const { electronicIssn, printIssn } = plan.community;
	log(`community ISSNs: electronic ${electronicIssn ?? 'none'}, print ${printIssn ?? 'none'}`);
	plan.warnings.forEach((warning) => log(`WARNING: ${warning}`));
	log(
		`${plan.items.length} to ${checkOnly ? 'check' : 'redeposit'}: ${collectionCount} collections, ${plan.items.length - collectionCount} pubs`,
	);
	log(
		`not included: ${plan.skipped.pubsWithoutDepositRecord} pubs with a DOI PubPub didn't deposit, ${plan.skipped.pubsWithoutRelease} without a release`,
	);
	if (!plan.items.length) {
		process.exit(0);
	}

	// Register the run so the dashboard shows it and won't start another one alongside it.
	const task = await WorkerTask.create({
		type: 'redepositDois',
		input: { communityId: community.id, pubSlug, limit, checkOnly, source: 'cli' },
		isProcessing: true,
	});

	let summary: Awaited<ReturnType<typeof redepositDoisTask>>;
	try {
		summary = await redepositDoisTask({
			communityId: community.id,
			workerTaskId: task.id,
			pubSlug,
			limit,
			checkOnly,
		});
	} catch (err: any) {
		const { output } = (await WorkerTask.findByPk(task.id)) ?? {};
		await task.update({ isProcessing: false, error: err?.message ?? String(err), output });
		throw err;
	}
	await task.update({ isProcessing: false, output: summary });

	summary.results
		.filter((result) => !['succeeded', 'ready'].includes(result.status))
		.forEach((result) =>
			log(`  ${result.status} ${result.doi} "${result.title}": ${result.message}`),
		);
	const outputPath = path.resolve(`redeposit-${subdomain}-${Date.now()}.json`);
	fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
	log(`${JSON.stringify(summary.counts)}${summary.stopped ? ' (stopped early)' : ''}`);
	log(`results in ${outputPath}`);
	const problems = summary.results.filter(
		(result) => !['succeeded', 'ready', 'skipped'].includes(result.status),
	);
	process.exit(problems.length > 0 ? 1 : 0);
};

main().catch((e) => {
	console.error(`[redeposit] ${e instanceof RedepositError ? '' : 'fatal: '}${e.message}`);
	process.exit(1);
});
