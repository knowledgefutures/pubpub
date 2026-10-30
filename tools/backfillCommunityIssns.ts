/**
 * Fill Communities.electronicIssn and printIssn from the ISSNs editors entered on issues, checked
 * against Crossref. Reports by default; writes nothing unless --apply is passed, and then only for
 * communities marked "ready" whose ISSN fields are still empty.
 *
 *   npm run tools backfillCommunityIssns                     # report for every community
 *   npm run tools backfillCommunityIssns -- --subdomain hdsr # one community
 *   npm run tools backfillCommunityIssns -- --apply          # write the "ready" ones
 *
 * The report is written to community-issns-<timestamp>.csv.
 */
import fs from 'fs';
import path from 'path';

import { type BackfillProposal, proposeCommunityIssns } from 'server/doi/issnBackfill';
import { Collection, Community } from 'server/models';

import { promptOkay } from './utils/prompt';

const getArgValue = (flag: string) => {
	const idx = process.argv.indexOf(flag);
	return idx !== -1 ? process.argv[idx + 1] : undefined;
};

const log = (msg: string) => console.log(`[issns] ${msg}`);

const csvCell = (value: string | null) => `"${(value ?? '').replace(/"/g, '""')}"`;

const toCsv = (proposals: BackfillProposal[]) =>
	[
		[
			'subdomain',
			'title',
			'status',
			'electronic_issn',
			'print_issn',
			'crossref_title',
			'problems',
			'issue_fixes',
		],
		...proposals.map((p) => [
			p.subdomain,
			p.title,
			p.status,
			p.electronicIssn,
			p.printIssn,
			p.crossrefTitle,
			p.problems.join(' | '),
			p.issueFixes.join(' | '),
		]),
	]
		.map((row) => row.map(csvCell).join(','))
		.join('\n');

const main = async () => {
	const subdomain = getArgValue('--subdomain');
	const apply = process.argv.includes('--apply');

	const communities = await Community.findAll({
		where: subdomain ? { subdomain } : {},
		attributes: ['id', 'subdomain', 'title', 'citeAs', 'electronicIssn', 'printIssn'],
		order: [['subdomain', 'ASC']],
	});
	const issues = await Collection.findAll({
		where: { kind: 'issue', communityId: communities.map((c) => c.id) },
		attributes: ['communityId', 'slug', 'metadata', 'createdAt'],
		order: [['createdAt', 'ASC']],
	});
	const issuesByCommunity = new Map<string, Collection[]>();
	issues.forEach((issue) => {
		const metadata = (issue.metadata ?? {}) as Record<string, string>;
		if (!metadata.electronicIssn?.trim() && !metadata.printIssn?.trim()) return;
		const list = issuesByCommunity.get(issue.communityId) ?? [];
		list.push(issue);
		issuesByCommunity.set(issue.communityId, list);
	});

	const proposals: BackfillProposal[] = [];
	for (const community of communities) {
		const communityIssues = issuesByCommunity.get(community.id);
		if (!communityIssues && !community.electronicIssn && !community.printIssn) continue;
		// biome-ignore lint/performance/noAwaitInLoops: polite, sequential Crossref lookups
		const proposal = await proposeCommunityIssns(
			community.toJSON(),
			(communityIssues ?? []).map((issue) => {
				const metadata = (issue.metadata ?? {}) as Record<string, string>;
				return {
					slug: issue.slug,
					electronicIssn: metadata.electronicIssn,
					printIssn: metadata.printIssn,
				};
			}),
		);
		proposals.push(proposal);
		const issns = `e ${proposal.electronicIssn ?? '-'}, p ${proposal.printIssn ?? '-'}`;
		log(`${proposal.subdomain}: ${proposal.status} (${issns})`);
		[...proposal.problems, ...proposal.issueFixes].forEach((line) => log(`    ${line}`));
	}

	const outputPath = path.resolve(`community-issns-${Date.now()}.csv`);
	fs.writeFileSync(outputPath, toCsv(proposals));
	const ready = proposals.filter((p) => p.status === 'ready');
	const counts = proposals.reduce<Record<string, number>>(
		(acc, p) => ({ ...acc, [p.status]: (acc[p.status] ?? 0) + 1 }),
		{},
	);
	log(`${JSON.stringify(counts)}. Report in ${outputPath}`);

	if (!apply) {
		log('Nothing written. Pass --apply to set the "ready" communities.');
		process.exit(0);
	}
	if (!ready.length) {
		log('No communities are ready to apply.');
		process.exit(0);
	}
	await promptOkay(`Set ISSNs on ${ready.length} communities?`, {
		throwIfNo: true,
		yesIsDefault: false,
	});
	let written = 0;
	for (const proposal of ready) {
		// Only fill fields that are still empty, in case someone set them since the report.
		// biome-ignore lint/performance/noAwaitInLoops: small, sequential updates
		const [count] = await Community.update(
			{ electronicIssn: proposal.electronicIssn, printIssn: proposal.printIssn },
			{ where: { id: proposal.communityId, electronicIssn: null, printIssn: null } },
		);
		written += count;
	}
	log(`Set ISSNs on ${written} communities.`);
	process.exit(0);
};

main().catch((e) => {
	console.error(`[issns] ${e.message}`);
	process.exit(1);
});
