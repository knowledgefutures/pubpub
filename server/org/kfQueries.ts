/**
 * What a KF Account (a console org) owns in PubPub, for the console: its orgs, their
 * communities, and usage. A KF Account can hold several orgs.
 */
import { Op } from 'sequelize';

import { Collection, Member, Org, Pub } from 'server/models';
import { communityUrl } from 'utils/canonicalUrls';
import { isDuqDuq } from 'utils/environment';

import { getOwnedCommunities } from './queries';

const orgUrl = (slug: string) => `https://www.${isDuqDuq() ? 'duqduq' : 'pubpub'}.org/org/${slug}`;

/** Counts rows per communityId with one grouped query */
const countByCommunity = async (
	model: typeof Pub | typeof Member | typeof Collection,
	communityIds: string[],
	where: Record<string, unknown> = {},
) => {
	if (communityIds.length === 0) {
		return new Map<string, number>();
	}
	const rows = (await (model as any).count({
		where: { communityId: communityIds, ...where },
		group: ['communityId'],
	})) as Array<{ communityId: string; count: number | string }>;
	return new Map(rows.map((r) => [r.communityId, Number(r.count)]));
};

const getAccountOrgs = async (kfOrgId: string) => {
	const orgs = await Org.findAll({
		where: { kfOrgId },
		attributes: ['id', 'slug', 'title', 'avatar'],
		order: [['title', 'ASC']],
	});
	return Promise.all(
		orgs.map(async (org) => ({
			org,
			communities: await getOwnedCommunities(org.id, [
				'id',
				'subdomain',
				'domain',
				'title',
				'avatar',
			]),
		})),
	);
};

/**
 * The console's org-assets shape: each PubPub org is an account, and its communities are the
 * account's collections.
 */
export const getKfAccountSummary = async (kfOrgId: string) => {
	const orgs = await getAccountOrgs(kfOrgId);
	const communityIds = orgs.flatMap(({ communities }) => communities.map((c) => c.id));
	const [pubCounts, memberCounts] = await Promise.all([
		countByCommunity(Pub, communityIds),
		countByCommunity(Member, communityIds),
	]);
	return orgs.map(({ org, communities }) => {
		const collections = communities.map((community) => ({
			id: community.id,
			slug: community.subdomain,
			type: 'community',
			name: community.title,
			url: communityUrl(community),
			avatar: community.avatar || null,
			stats: {
				pubs: pubCounts.get(community.id) ?? 0,
				members: memberCounts.get(community.id) ?? 0,
			},
		}));
		return {
			id: org.id,
			slug: org.slug,
			type: 'org',
			name: org.title,
			url: orgUrl(org.slug),
			avatar: org.avatar || null,
			stats: {
				communities: collections.length,
				pubs: collections.reduce((sum, c) => sum + c.stats.pubs, 0),
			},
			collections,
		};
	});
};

/**
 * Billable usage across the KF Account's orgs: communities owned, and DOIs deposited with
 * Crossref (one deposit record per registered pub or collection). With a window, deposits
 * count the items first registered in it.
 */
export const getKfAccountUsage = async (
	kfOrgId: string,
	window: { since?: Date; until?: Date } = {},
) => {
	const orgs = await getAccountOrgs(kfOrgId);
	const communityIds = orgs.flatMap(({ communities }) => communities.map((c) => c.id));
	const depositedAt: Record<symbol, Date> = {};
	if (window.since) depositedAt[Op.gte] = window.since;
	if (window.until) depositedAt[Op.lt] = window.until;
	const depositWhere = {
		crossrefDepositRecordId: { [Op.ne]: null },
		...(window.since || window.until
			? { '$crossrefDepositRecord.createdAt$': depositedAt }
			: {}),
	};
	const countDeposits = async (model: typeof Pub | typeof Collection) => {
		if (communityIds.length === 0) {
			return new Map<string, number>();
		}
		const rows = (await (model as any).count({
			where: { communityId: communityIds, ...depositWhere },
			include: [{ association: 'crossrefDepositRecord', attributes: [] }],
			group: ['communityId'],
		})) as Array<{ communityId: string; count: number | string }>;
		return new Map(rows.map((r) => [r.communityId, Number(r.count)]));
	};
	const [pubDeposits, collectionDeposits] = await Promise.all([
		countDeposits(Pub),
		countDeposits(Collection),
	]);
	const depositsFor = (communityId: string) =>
		(pubDeposits.get(communityId) ?? 0) + (collectionDeposits.get(communityId) ?? 0);

	const perOrg = orgs.map(({ org, communities }) => ({
		orgId: org.id,
		slug: org.slug,
		communities: communities.length,
		doiDeposits: communities.reduce((sum, c) => sum + depositsFor(c.id), 0),
	}));
	return {
		kf_org_id: kfOrgId,
		since: window.since?.toISOString() ?? null,
		until: window.until?.toISOString() ?? null,
		line_items: [
			{ key: 'communities', quantity: perOrg.reduce((sum, o) => sum + o.communities, 0) },
			{ key: 'doi_deposits', quantity: perOrg.reduce((sum, o) => sum + o.doiDeposits, 0) },
		],
		orgs: perOrg,
	};
};
