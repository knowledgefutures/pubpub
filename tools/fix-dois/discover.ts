import { Op } from 'sequelize';

import { Community, CrossrefDepositRecord, Pub } from 'server/models';
import { isDoiPending } from 'utils/crossref/depositStatus';

import {
	applyRange,
	type CheckResult,
	checkDoisInCrossref,
	createLogger,
	getArgValue,
	writeResults,
} from './shared';

type DiscoveredEntry = {
	working: boolean;
	doi: string;
	pub: string;
	slug: string;
	id: string;
	communityId: string;
	communitySubdomain: string;
	error: string;
	/** Recorded deposit state, when there is one: 'failed' here explains itself. */
	depositStatus: string | null;
	time: string;
};

const { log, warn } = createLogger('discover-dois');

async function resolveCommunityId(): Promise<string | null> {
	const communityId = getArgValue('--community');
	if (communityId) {
		return communityId;
	}

	const subdomain = getArgValue('--subdomain');
	if (!subdomain) {
		return null;
	}

	const community = await Community.findOne({ where: { subdomain } });
	if (!community) {
		warn(`community with subdomain "${subdomain}" not found`);
		process.exit(1);
	}
	return community.id;
}

async function main() {
	const communityId = await resolveCommunityId();

	const where: any = {
		doi: { [Op.not]: null },
		crossrefDepositRecordId: { [Op.not]: null },
	};
	if (communityId) {
		where.communityId = communityId;
		log(`scanning pubs in community ${communityId}...`);
	} else {
		log(`scanning ALL deposited pubs across all communities...`);
	}

	const allPubsIncludingPending = await Pub.findAll({
		where,
		attributes: ['id', 'title', 'slug', 'doi', 'communityId'],
		include: [
			{
				model: Community,
				as: 'community',
				attributes: ['subdomain'],
			},
			{
				model: CrossrefDepositRecord,
				as: 'crossrefDepositRecord',
				attributes: ['status', 'error'],
			},
		],
		order: [['createdAt', 'DESC']],
	});

	// A pub whose deposit is still in flight is *supposed* not to resolve yet, so
	// checking it produces a false "broken DOI" that an operator then chases. A
	// NULL status is every pre-verdict deposit and is still checked, which is the
	// behaviour this tool has always had. Failed deposits stay in the run: they
	// really are broken, and the recorded error explains why.
	const allPubs = allPubsIncludingPending.filter(
		(pub) => !isDoiPending((pub as any).crossrefDepositRecord?.status),
	);
	const pendingCount = allPubsIncludingPending.length - allPubs.length;
	if (pendingCount > 0) {
		log(`skipping ${pendingCount} pubs whose deposit is still in flight`);
	}

	const pubs = applyRange(allPubs);
	log(`found ${allPubs.length} deposited pubs, checking ${pubs.length}`);

	const checkResults = await checkDoisInCrossref(
		pubs,
		(pub) => pub.doi,
		(checked, total) => log(`  checked ${checked}/${total}`),
	);

	const broken: DiscoveredEntry[] = [];
	const workingCount = { value: 0 };

	for (const pub of pubs) {
		const result = checkResults.get(pub) as CheckResult;
		if (result.ok) {
			workingCount.value++;
			continue;
		}
		const pubJson = pub.toJSON() as any;
		broken.push({
			working: false,
			doi: pub.doi!,
			pub: pub.title,
			slug: pub.slug,
			id: pub.id,
			communityId: pub.communityId,
			communitySubdomain: pubJson.community?.subdomain ?? 'unknown',
			error: result.error ?? 'Not Found',
			depositStatus: pubJson.crossrefDepositRecord?.status ?? null,
			time: new Date().toISOString(),
		});
	}

	log(`\nresults:`);
	log(`  working: ${workingCount.value}`);
	log(`  broken: ${broken.length}`);

	if (broken.length > 0) {
		log(`\nbroken DOIs:`);
		const byCommunity = new Map<string, DiscoveredEntry[]>();
		for (const entry of broken) {
			const key = entry.communitySubdomain;
			const existing = byCommunity.get(key) ?? [];
			existing.push(entry);
			byCommunity.set(key, existing);
		}
		for (const [subdomain, entries] of byCommunity) {
			log(`  ${subdomain}: ${entries.length} broken`);
			for (const e of entries) {
				log(`    ${e.doi} - "${e.pub}"`);
			}
		}
	}

	const suffix = communityId ? `community-${communityId.slice(0, 8)}` : 'all';
	const outputPath = writeResults(`discovered-${suffix}`, broken);
	log(`\nbroken DOIs written to ${outputPath}`);
	log(`this file can be used directly as --input to fixDois or verifyDois`);

	if (broken.length > 0) {
		process.exit(1);
	}
	process.exit(0);
}

main().catch((e) => {
	console.error(`[discover-dois] fatal: ${e.message}`);
	console.error(e);
	process.exit(1);
});
