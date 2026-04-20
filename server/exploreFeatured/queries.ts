import { Op, QueryTypes } from 'sequelize';

import { Community, ScopeSummary, SpamTag } from 'server/models';
import { sequelize } from 'server/sequelize';

export const getExploreCommunities = async () => {
	const communities = await Community.findAll({
		attributes: [
			'id',
			'subdomain',
			'domain',
			'title',
			'description',
			'heroLogo',
			'accentColorDark',
			'isFeatured',
			'createdAt',
			'updatedAt',
		],
		include: [
			{
				model: SpamTag,
				as: 'spamTag',
				attributes: ['status'],
				required: false,
			},
			{
				model: ScopeSummary,
				as: 'scopeSummary',
				attributes: ['pubs', 'collections', 'discussions', 'reviews', 'submissions'],
				required: false,
			},
		],
		where: {
			[Op.or]: [{ spamTagId: null }, { '$spamTag.status$': 'confirmed-not-spam' }],
		},
	});

	const communityIds = communities.map((c) => c.id);
	if (communityIds.length === 0) return [];

	// Yearly pageviews from the analytics_daily_summary materialized view
	const oneYearAgo = new Date();
	oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
	let pageviewMap: Record<string, number> = {};
	try {
		const pageviewRows = await sequelize.query<{
			communityId: string;
			yearlyPageviews: string;
		}>(
			`SELECT "communityId", SUM(page_views)::text AS "yearlyPageviews"
			 FROM analytics_daily_summary
			 WHERE date >= :startDate::date
			 GROUP BY "communityId"`,
			{
				replacements: { startDate: oneYearAgo.toISOString().slice(0, 10) },
				type: QueryTypes.SELECT,
			},
		);
		pageviewMap = Object.fromEntries(
			pageviewRows.map((r) => [r.communityId, parseInt(r.yearlyPageviews, 10) || 0]),
		);
	} catch {
		// matview may not exist in dev; fall back gracefully
	}

	// Discussion counts excluding spam users
	const discussionRows = await sequelize.query<{
		communityId: string;
		discussionCount: string;
	}>(
		`SELECT p."communityId", COUNT(d.id)::text AS "discussionCount"
		 FROM "Discussions" d
		 JOIN "Pubs" p ON p.id = d."pubId"
		 LEFT JOIN "Users" u ON u.id = d."userId"
		 WHERE p."communityId" IN (:communityIds)
		   AND (u."spamTagId" IS NULL
		        OR u."spamTagId" NOT IN (
		            SELECT id FROM "SpamTags" WHERE status = 'confirmed-spam'
		        ))
		 GROUP BY p."communityId"`,
		{
			replacements: { communityIds },
			type: QueryTypes.SELECT,
		},
	);
	const discussionMap: Record<string, number> = Object.fromEntries(
		discussionRows.map((r) => [r.communityId, parseInt(r.discussionCount, 10) || 0]),
	);

	return communities.map((c) => {
		const json = c.toJSON() as any;
		const summary = json.scopeSummary || {};
		const cleanDiscussions = discussionMap[c.id] || 0;
		json.yearlyPageviews = pageviewMap[c.id] || 0;
		json.cleanDiscussions = cleanDiscussions;
		json.activityScore =
			(summary.pubs || 0) * 3 +
			cleanDiscussions +
			(summary.collections || 0) * 2 +
			(summary.reviews || 0) +
			(summary.submissions || 0);
		return json;
	});
};
