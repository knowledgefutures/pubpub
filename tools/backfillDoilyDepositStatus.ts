/**
 * Teach every existing deposit record what actually happened to its DOI.
 *
 * Deposit state only started being recorded when Doily began pushing outcomes
 * (server/doily/webhook.ts), so every row deposited before that has a NULL
 * status. NULL renders exactly as it always did, which is the safe default and
 * also a permanent one: without this run the dashboard keeps saying "deposited"
 * about DOIs Crossref rejected. Doily already knows the answer for all of them,
 * so this pages through its deposit list per organization and matches on DOI.
 *
 * Matching is by DOI because that is the only join available: a row deposited
 * before this feature has no doilyDepositId. Rows it does match get the id
 * stamped on, so from then on the webhook finds them directly.
 *
 *   pnpm run tools backfillDoilyDepositStatus                       # dry run, every doily community
 *   pnpm run tools backfillDoilyDepositStatus --subdomain demo      # dry run, one community
 *   pnpm run tools backfillDoilyDepositStatus --execute             # write
 *
 * On prod use `tools-prod`, e.g.
 *   pnpm run tools-prod backfillDoilyDepositStatus --execute
 */
import type { DepositState } from 'server/crossrefDepositRecord/queries';

import { Op } from 'sequelize';

import {
	DOILY_FLAG,
	type DoilyDepositSummary,
	findDoilyOrgId,
	isDoilyConfigured,
	listDoilyDeposits,
} from 'server/doily/client';
import { isFeatureFlagEnabledForUserInCommunity } from 'server/featureFlag/helpers';
import { getFeatureFlagByName } from 'server/featureFlag/queries';
import {
	Collection,
	Community,
	CrossrefDepositRecord,
	FeatureFlagCommunity,
	Pub,
} from 'server/models';
import { isDepositStatus } from 'utils/crossref/depositStatus';

const PAGE_SIZE = 200;
const WRITE_CHUNK_SIZE = 25;

const log = (message: string) => console.log(`[backfill-doily-status] ${message}`);
const warn = (message: string) => console.warn(`[backfill-doily-status] WARN: ${message}`);

const getArgValue = (flag: string) => {
	const index = process.argv.indexOf(flag);
	return index === -1 ? null : (process.argv[index + 1] ?? null);
};

const execute = process.argv.includes('--execute');

/**
 * Communities the flag is on for, evaluated with the same helper production
 * uses: an explicit per-community override is the usual way it is enabled, but
 * enabledCommunitiesFraction can switch it on without any override row, and a
 * backfill that ignored that would silently skip those communities.
 */
const getDoilyCommunities = async (subdomain: string | null) => {
	const featureFlag = await getFeatureFlagByName(DOILY_FLAG);
	if (!featureFlag) {
		warn(`no ${DOILY_FLAG} feature flag exists in this environment`);
		return [];
	}
	const featureFlagCommunities = await FeatureFlagCommunity.findAll({
		where: { featureFlagId: featureFlag.id },
	});
	const explicitlyOnIds = featureFlagCommunities
		.filter((override) => override.enabled)
		.map((override) => override.communityId)
		.filter((id): id is string => Boolean(id));

	const where: Record<string, unknown> = {};
	if (subdomain) {
		where.subdomain = subdomain;
	} else if (!featureFlag.enabledCommunitiesFraction) {
		where.id = explicitlyOnIds;
	}

	const communities = await Community.findAll({
		where,
		attributes: ['id', 'subdomain', 'title'],
	});
	return communities.filter((community) =>
		isFeatureFlagEnabledForUserInCommunity({
			featureFlag,
			userId: null,
			communityId: community.id,
			featureFlagUsers: [],
			featureFlagCommunities,
		}),
	);
};

/** Every deposit Doily holds for a project, keyed by lowercased DOI. */
const fetchDepositsByDoi = async (projectId: string) => {
	const byDoi = new Map<string, DoilyDepositSummary>();
	let offset = 0;
	for (;;) {
		// biome-ignore lint/performance/noAwaitInLoops: offset pagination is inherently sequential, the next offset depends on how many items this response returned
		const page = await listDoilyDeposits({ projectId, limit: PAGE_SIZE, offset });
		for (const item of page.items) {
			if (!item.doi) {
				continue;
			}
			const key = item.doi.toLowerCase();
			const seen = byDoi.get(key);
			// A DOI can have been deposited more than once (an update, or a retry
			// after a rejection). The most recently touched row is the one whose
			// status is true now.
			if (!seen || new Date(item.updatedAt) > new Date(seen.updatedAt)) {
				byDoi.set(key, item);
			}
		}
		offset += page.items.length;
		if (page.items.length === 0 || offset >= page.total) {
			return byDoi;
		}
	}
};

type Target = {
	kind: 'pub' | 'collection';
	id: string;
	doi: string;
	crossrefDepositRecordId: string;
};

const getDepositedTargets = async (communityId: string): Promise<Target[]> => {
	const where = {
		communityId,
		doi: { [Op.not]: null },
		crossrefDepositRecordId: { [Op.not]: null },
	};
	const [pubs, collections] = await Promise.all([
		Pub.findAll({ where, attributes: ['id', 'doi', 'crossrefDepositRecordId'] }),
		Collection.findAll({ where, attributes: ['id', 'doi', 'crossrefDepositRecordId'] }),
	]);
	return [
		...pubs.map((pub) => ({
			kind: 'pub' as const,
			id: pub.id,
			doi: pub.doi!,
			crossrefDepositRecordId: pub.crossrefDepositRecordId!,
		})),
		...collections.map((collection) => ({
			kind: 'collection' as const,
			id: collection.id,
			doi: collection.doi!,
			crossrefDepositRecordId: collection.crossrefDepositRecordId!,
		})),
	];
};

const backfillCommunity = async (community: { id: string; subdomain: string }) => {
	const counts = { matched: 0, updated: 0, unchanged: 0, unknownToDoily: 0, noRecord: 0 };

	const projectId = await findDoilyOrgId(community.id);
	if (!projectId) {
		warn(`${community.subdomain} has no Doily project yet, skipping`);
		return counts;
	}

	const [depositsByDoi, targets] = await Promise.all([
		fetchDepositsByDoi(projectId),
		getDepositedTargets(community.id),
	]);
	log(
		`${community.subdomain}: ${targets.length} deposited works, ${depositsByDoi.size} DOIs known to Doily`,
	);

	// One query for the whole community's deposit records rather than one per
	// work: the biggest communities have tens of thousands of them.
	const records = await CrossrefDepositRecord.findAll({
		where: { id: targets.map((target) => target.crossrefDepositRecordId) },
	});
	const recordsById = new Map(records.map((record) => [record.id, record]));

	const pendingWrites: { record: CrossrefDepositRecord; values: DepositState }[] = [];

	for (const target of targets) {
		const summary = depositsByDoi.get(target.doi.toLowerCase());
		if (!summary) {
			// Deposited through the legacy Crossref path, before this community
			// was moved onto Doily. Doily has no verdict to offer, so the row
			// stays NULL and keeps rendering as it always has.
			counts.unknownToDoily += 1;
			continue;
		}
		if (!isDepositStatus(summary.status)) {
			warn(`${target.doi} has status ${summary.status}, which this build does not know`);
			continue;
		}
		counts.matched += 1;

		const record = recordsById.get(target.crossrefDepositRecordId);
		if (!record) {
			warn(`${target.kind} ${target.id} points at a deposit record that does not exist`);
			counts.noRecord += 1;
			continue;
		}

		// Doily's updatedAt, not now(): lastCheckedAt means "the state in these
		// columns was true at this moment", and the webhook drops a stale pending
		// assertion by comparing against it. Stamping now() would make a
		// three-day-old status look like the freshest thing we know.
		const lastCheckedAt = new Date(summary.updatedAt);
		const values = {
			status: summary.status,
			doilyDepositId: summary.id,
			doi: summary.doi,
			error: summary.error ?? null,
			lastCheckedAt: Number.isNaN(lastCheckedAt.getTime()) ? new Date() : lastCheckedAt,
		};

		const alreadyCorrect =
			record.status === values.status &&
			record.doilyDepositId === values.doilyDepositId &&
			record.doi === values.doi &&
			record.error === values.error;
		if (alreadyCorrect) {
			counts.unchanged += 1;
			continue;
		}

		log(
			`${execute ? 'updating' : 'would update'} ${target.doi} (${target.kind} ${target.id}): ${record.status ?? 'NULL'} -> ${values.status}`,
		);
		pendingWrites.push({ record, values });
		counts.updated += 1;
	}

	if (execute) {
		// Chunked rather than one big Promise.all: every row needs its own UPDATE
		// (the values differ per row), and firing tens of thousands at once would
		// exhaust the connection pool that the live site is also using.
		for (let index = 0; index < pendingWrites.length; index += WRITE_CHUNK_SIZE) {
			const chunk = pendingWrites.slice(index, index + WRITE_CHUNK_SIZE);
			// biome-ignore lint/performance/noAwaitInLoops: the concurrency is inside the chunk, and letting chunks overlap is the pool exhaustion this avoids
			await Promise.all(chunk.map(({ record, values }) => record.update(values)));
		}
	}

	return counts;
};

const main = async () => {
	if (!isDoilyConfigured()) {
		warn('DOILY_URL and DOILY_API_TOKEN are not both set, nothing to read from');
		process.exit(1);
	}
	if (!execute) {
		log('DRY RUN. Pass --execute to write, nothing will be modified.');
	}

	const subdomain = getArgValue('--subdomain');
	const communities = await getDoilyCommunities(subdomain);
	if (communities.length === 0) {
		warn(
			`no communities with the ${DOILY_FLAG} flag${subdomain ? ` matching ${subdomain}` : ''}`,
		);
		process.exit(1);
	}
	log(`${communities.length} community/communities with ${DOILY_FLAG}`);

	const totals = { matched: 0, updated: 0, unchanged: 0, unknownToDoily: 0, noRecord: 0 };
	for (const community of communities) {
		try {
			// biome-ignore lint/performance/noAwaitInLoops: one community at a time, each pages through Doily and writes to the DB the live site is using, and the log is only readable in order
			const counts = await backfillCommunity(community);
			for (const key of Object.keys(totals) as (keyof typeof totals)[]) {
				totals[key] += counts[key];
			}
		} catch (err) {
			// One community's Doily outage must not abandon the rest of the run:
			// the whole point is to get as many rows honest as possible.
			warn(`${community.subdomain} failed: ${err instanceof Error ? err.message : err}`);
		}
	}

	log(
		`done. matched=${totals.matched} updated=${totals.updated} unchanged=${totals.unchanged} unknownToDoily=${totals.unknownToDoily} missingRecord=${totals.noRecord}`,
	);
	process.exit(0);
};

main().catch((err) => {
	console.error(`[backfill-doily-status] fatal: ${err instanceof Error ? err.message : err}`);
	console.error(err);
	process.exit(1);
});
