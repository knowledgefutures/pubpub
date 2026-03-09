import type * as types from 'types';

import { literal, Op } from 'sequelize';

import {
	Community,
	Discussion,
	Member,
	Pub,
	PubAttribution,
	SpamTag,
	Thread,
	ThreadComment,
	User,
} from 'server/models';

const orderableFields = {
	'user-created-at': ['createdAt'],
	'spam-status-updated-at': [{ model: SpamTag, as: 'spamTag' }, 'statusUpdatedAt'],
	'spam-score': [{ model: SpamTag, as: 'spamTag' }, 'spamScore'],
} as const;

// pub activity kinds tracked by the ActivityItems table
const pubActivityKinds = `'pub-created','pub-updated','pub-removed','pub-release-created','pub-discussion-comment-added','pub-edge-created','pub-edge-removed','pub-review-created','pub-review-comment-added','pub-review-updated'`;

const lastActivitySubquery = `COALESCE((
	SELECT MAX("timestamp") FROM "ActivityItems"
	WHERE "ActivityItems"."actorId" = "User"."id"
	AND "ActivityItems"."kind" IN (${pubActivityKinds})
), '1970-01-01'::timestamp)`;

const activityCountSubquery = `(
	SELECT COUNT(*) FROM "ActivityItems"
	WHERE "ActivityItems"."actorId" = "User"."id"
	AND "ActivityItems"."kind" IN (${pubActivityKinds})
)`;

const getUserWhereQuery = (options: {
	searchTerm?: string | null;
	spamTagPresence?: types.SpamUserQuery['spamTagPresence'];
	communitySubdomain?: string;
	createdAfter?: string;
	createdBefore?: string;
	activeAfter?: string;
	activeBefore?: string;
	minActivities?: number;
	maxActivities?: number;
}) => {
	const conditions: any[] = [];

	if (options.searchTerm) {
		const normalizedQuery = `%${options.searchTerm.trim()}%`;
		conditions.push({
			[Op.or]: [
				{ fullName: { [Op.iLike]: normalizedQuery } },
				{ email: { [Op.iLike]: normalizedQuery } },
				{ slug: { [Op.iLike]: normalizedQuery } },
			],
		});
	}

	if (options.spamTagPresence === 'absent') {
		conditions.push({ spamTagId: { [Op.is]: null } });
	}

	if (options.communitySubdomain) {
		const escaped = User.sequelize!.escape(`%${options.communitySubdomain.trim()}%`);
		conditions.push({
			id: {
				[Op.in]: literal(`(
					SELECT "userId" FROM "Members"
					INNER JOIN "Communities" ON "Communities"."id" = "Members"."communityId"
					WHERE "Communities"."subdomain" ILIKE ${escaped}
					UNION
					SELECT "userId" FROM "Discussions"
					INNER JOIN "Pubs" ON "Pubs"."id" = "Discussions"."pubId"
					INNER JOIN "Communities" ON "Communities"."id" = "Pubs"."communityId"
					WHERE "Communities"."subdomain" ILIKE ${escaped}
				)`),
			},
		});
	}

	if (options.createdAfter) {
		conditions.push({ createdAt: { [Op.gte]: new Date(options.createdAfter) } });
	}
	if (options.createdBefore) {
		conditions.push({ createdAt: { [Op.lte]: new Date(options.createdBefore) } });
	}
	if (options.activeAfter) {
		const escaped = User.sequelize!.escape(options.activeAfter);
		conditions.push(literal(`(${lastActivitySubquery}) >= ${escaped}::timestamp`));
	}
	if (options.activeBefore) {
		const escaped = User.sequelize!.escape(options.activeBefore);
		conditions.push(literal(`(${lastActivitySubquery}) <= ${escaped}::timestamp`));
	}
	if (options.minActivities != null) {
		conditions.push(literal(`${activityCountSubquery} >= ${Number(options.minActivities)}`));
	}
	if (options.maxActivities != null) {
		conditions.push(literal(`${activityCountSubquery} <= ${Number(options.maxActivities)}`));
	}

	if (conditions.length === 0) return {};
	if (conditions.length === 1) return { where: conditions[0] };
	return { where: { [Op.and]: conditions } };
};

const getSpamTagStatusWhereQuery = (status: undefined | types.SpamStatus[] | null) => {
	if (status && status.length > 0) {
		return { where: { status: { [Op.in]: status } } };
	}
	return {};
};

const getQueryOrdering = (ordering: types.SpamUserQueryOrdering): [any, string][] => {
	const { field, direction } = ordering;
	if (field === 'discussion-count') {
		return [
			[
				literal(
					'(SELECT COUNT(*) FROM "Discussions" WHERE "Discussions"."userId" = "User"."id")',
				),
				direction,
			],
		];
	}
	if (field === 'last-activity') {
		return [[literal(`(${lastActivitySubquery})`), direction]];
	}
	if (field === 'activity-count') {
		return [[literal(activityCountSubquery), direction]];
	}
	return [[...orderableFields[field as keyof typeof orderableFields], direction]] as any;
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
	const {
		limit,
		offset,
		ordering,
		status,
		searchTerm,
		includeAffiliation,
		spamTagPresence,
		communitySubdomain,
		createdAfter,
		createdBefore,
		activeAfter,
		activeBefore,
		minActivities,
		maxActivities,
	} = query;
	const hasStatusFilter = status && status.length > 0;
	const spamTagRequired = spamTagPresence === 'present' || !!hasStatusFilter;
	const include = [
		{
			model: SpamTag,
			as: 'spamTag',
			required: spamTagRequired,
			...getSpamTagStatusWhereQuery(status),
		},
	];
	const rows = (await User.findAll({
		...getUserWhereQuery({
			searchTerm,
			spamTagPresence,
			communitySubdomain,
			createdAfter,
			createdBefore,
			activeAfter,
			activeBefore,
			minActivities,
			maxActivities,
		}),
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

export const getAffiliationForUserIds = async (
	userIds: string[],
): Promise<Map<string, types.SpamUserAffiliation>> => {
	const [members, attributions, discussions] = await Promise.all([
		Member.findAll({
			raw: true,
			where: { userId: { [Op.in]: userIds } },
			attributes: ['userId', 'communityId'],
			include: [{ model: Community, as: 'community', attributes: ['subdomain'] }],
		}),
		PubAttribution.findAll({
			raw: true,
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
			raw: true,
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
				const subdomain = m['community.subdomain'];
				if (subdomain) {
					subdomains.add(subdomain);
				}
			}
		}
		for (const a of attributions) {
			if (a.userId === uid) {
				pubCount += 1;

				const subdomain = a['pub.community.subdomain'];
				if (subdomain) {
					subdomains.add(subdomain);
				}
			}
		}
		for (const d of discussions) {
			if (d.userId === uid) {
				discussionCount += 1;
				const subdomain = d['pub.community.subdomain'];
				if (subdomain) {
					subdomains.add(subdomain);
				}
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

export const getRecentDiscussionsForUser = async (
	userId: string,
): Promise<types.RecentDiscussion[]> => {
	const discussions = await Discussion.findAll({
		where: { userId },
		attributes: ['id', 'title', 'createdAt'],
		order: [['createdAt', 'DESC']],
		limit: 3,
		include: [
			{
				model: Pub,
				as: 'pub',
				attributes: ['title', 'slug'],
				include: [{ model: Community, as: 'community', attributes: ['subdomain'] }],
			},
			{
				model: Thread,
				as: 'thread',
				attributes: ['id'],
				include: [
					{
						model: ThreadComment,
						as: 'comments',
						attributes: ['text'],
						limit: 1,
						order: [['createdAt', 'ASC']],
					},
				],
			},
		],
	});

	return discussions.map((d) => {
		const json = d.toJSON();
		return {
			id: json.id,
			title: json.title,
			createdAt: json.createdAt,
			pubTitle: json.pub?.title ?? null,
			pubSlug: json.pub?.slug ?? null,
			communitySubdomain: json.pub?.community?.subdomain ?? null,
			firstCommentText: json.thread?.comments?.[0]?.text ?? null,
		};
	});
};
