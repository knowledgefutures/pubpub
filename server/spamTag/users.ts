import type * as types from 'types';

import { Op } from 'sequelize';

import { Community, Discussion, Member, Pub, PubAttribution, SpamTag, User } from 'server/models';

const orderableFields = {
	'user-created-at': ['createdAt'],
	'spam-status-updated-at': [{ model: SpamTag, as: 'spamTag' }, 'statusUpdatedAt'],
	'spam-score': [{ model: SpamTag, as: 'spamTag' }, 'spamScore'],
} as const;

const getUserWhereQuery = (searchTerm?: string | null) => {
	if (searchTerm) {
		const normalizedQuery = `%${searchTerm.trim()}%`;
		return {
			where: {
				[Op.or]: [
					{ fullName: { [Op.iLike]: normalizedQuery } },
					{ email: { [Op.iLike]: normalizedQuery } },
					{ slug: { [Op.iLike]: normalizedQuery } },
				],
			},
		};
	}
	return {};
};

const getSpamTagStatusWhereQuery = (status: undefined | types.SpamStatus[] | null) => {
	if (status && status.length > 0) {
		return { where: { status: { [Op.in]: status } } };
	}
	return {};
};

type OrderFields = (typeof orderableFields)[keyof typeof orderableFields];
const getQueryOrdering = (ordering: types.SpamUserQueryOrdering) => {
	const { field, direction } = ordering;
	return [[...orderableFields[field], direction]] as [OrderFields[number], 'ASC' | 'DESC'][];
};

export type UserSpamManagementRow =
	| types.DefinitelyHas<User, 'spamTag'>
	| (types.User & { spamTag: null });

type SerializedSpamUserRow = Record<string, unknown> & {
	id: string;
	affiliation?: types.SpamUserAffiliation;
};

export const queryUsersForSpamManagement = async (
	query: types.SpamUserQuery,
): Promise<SerializedSpamUserRow[]> => {
	const { limit, offset, ordering, status, searchTerm, includeAffiliation } = query;
	const includeAllUsers = !status || status.length === 0;
	const include = [
		{
			model: SpamTag,
			as: 'spamTag',
			required: !includeAllUsers,
			...getSpamTagStatusWhereQuery(status),
		},
	];
	const rows = (await User.findAll({
		...getUserWhereQuery(searchTerm),
		attributes: ['id', 'fullName', 'email', 'slug', 'createdAt'],
		limit,
		offset,
		order: getQueryOrdering(ordering),
		include,
	})) as UserSpamManagementRow[];

	const plain = rows.map((r) => {
		const row = r as any;
		return (row.toJSON ? row.toJSON() : row) as Record<string, unknown>;
	});
	if (includeAffiliation && plain.length > 0) {
		const userIds = plain.map((r) => r.id as string);
		const affiliationMap = await getAffiliationForUserIds(userIds);
		return plain.map((r) => ({
			...r,
			affiliation: affiliationMap.get(r.id as string),
		})) as SerializedSpamUserRow[];
	}
	return plain as SerializedSpamUserRow[];
};

const getAffiliationForUserIds = async (
	userIds: string[],
): Promise<Map<string, types.SpamUserAffiliation>> => {
	const [members, attributions, discussions] = await Promise.all([
		Member.findAll({
			where: { userId: { [Op.in]: userIds } },
			attributes: ['userId', 'communityId'],
			include: [{ model: Community, as: 'community', attributes: ['subdomain'] }],
		}),
		PubAttribution.findAll({
			where: { userId: { [Op.in]: userIds } },
			attributes: ['userId'],
			include: [
				{
					model: Pub,
					as: 'pub',
					attributes: ['communityId'],
					include: [{ model: Community, as: 'community', attributes: ['subdomain'] }],
				},
			],
		}),
		Discussion.findAll({
			where: { userId: { [Op.in]: userIds } },
			attributes: ['userId', 'pubId'],
			include: [
				{
					model: Pub,
					as: 'pub',
					attributes: ['communityId'],
					include: [{ model: Community, as: 'community', attributes: ['subdomain'] }],
				},
			],
		}),
	]);
	const map = new Map<string, types.SpamUserAffiliation>();
	for (const uid of userIds) {
		const subdomains = new Set<string>();
		let pubCount = 0;
		let discussionCount = 0;
		for (const m of members) {
			if (m.userId === uid) {
				const comm = (m as any).community;
				if (comm?.subdomain) subdomains.add(comm.subdomain);
			}
		}
		for (const a of attributions) {
			if (a.userId === uid) {
				pubCount += 1;
				const pub = (a as any).pub;
				if (pub?.community?.subdomain) subdomains.add(pub.community.subdomain);
			}
		}
		for (const d of discussions) {
			if (d.userId === uid) {
				discussionCount += 1;
				const pub = (d as any).pub;
				if (pub?.community?.subdomain) subdomains.add(pub.community.subdomain);
			}
		}
		map.set(uid, {
			communitySubdomains: Array.from(subdomains).slice(0, 10),
			pubCount,
			discussionCount,
		});
	}
	return map;
};
