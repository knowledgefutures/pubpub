/**
 * Suggested-community discovery for an Hub's configured domains.
 *
 * For each domain in Hub.domains we look for Communities that have
 * managers (Members with permissions = 'manage') or authors (PubAttributions)
 * whose email domain matches. Only public data is returned. Person names
 * are never exposed — only role counts (e.g. "2 managers", "13 authors").
 */
import { QueryTypes } from 'sequelize';

import { sequelize } from 'server/sequelize';

export type SuggestedCommunity = {
	communityId: string;
	title: string;
	subdomain: string;
	domain: string | null;
	description: string | null;
	heroLogo: string | null;
	accentColorDark: string | null;
	accentColorLight: string | null;
	createdAt: string;
	pubCount: number;
	managerCount: number;
	authorCount: number;
	/** true if the community is already in HubCommunities for this org */
	alreadyAdded: boolean;
};

/**
 * Build parameterized domain-match clauses.
 * Returns { sql, replacements } for use in raw queries.
 * e.g. for ["mit.edu", "ox.ac.uk"] →
 *   (col = :dom0 OR col LIKE :domLike0) OR (col = :dom1 OR col LIKE :domLike1)
 */
const buildDomainMatchClauses = (
	col: string,
	domains: string[],
): { sql: string; replacements: Record<string, string> } => {
	const parts: string[] = [];
	const replacements: Record<string, string> = {};
	domains.forEach((d, i) => {
		const clean = d.toLowerCase();
		parts.push(`(${col} = :dom${i} OR ${col} LIKE :domLike${i})`);
		replacements[`dom${i}`] = clean;
		replacements[`domLike${i}`] = `%.${clean}`;
	});
	return { sql: parts.join(' OR '), replacements };
};

/** SQL expression: extract domain from email column */
const rawDomainSql = (emailExpr: string) => `LOWER(SUBSTRING(${emailExpr} FROM '@(.+)$'))`;

/**
 * Get suggested communities for an hub based on its configured email domains.
 * All data is public-only. No person names are returned — just counts.
 */
export const getSuggestedCommunities = async (hubId: string): Promise<SuggestedCommunity[]> => {
	// 1. Get the hub's configured domains
	const hub = await sequelize.query<{ domains: string[] | null }>(
		`SELECT "domains" FROM "Hubs" WHERE "id" = :orgId`,
		{ replacements: { orgId: hubId }, type: QueryTypes.SELECT },
	);
	const domains = (hub[0]?.domains ?? []).map((d) => d.toLowerCase());
	if (domains.length === 0) return [];

	// Build domain-match OR clause with parameterized replacements
	const domainExpr = rawDomainSql('"Users"."email"');
	const { sql: domainWhere, replacements: domainReplacements } = buildDomainMatchClauses(
		domainExpr,
		domains,
	);

	// 2. Find managers (Members with manage permission) matching any domain
	const managersQuery = `
		SELECT
			"Members"."communityId" AS "communityId",
			COUNT(DISTINCT "Members"."userId") AS "managerCount"
		FROM "Members"
		INNER JOIN "Users" ON "Users"."id" = "Members"."userId"
		WHERE "Members"."communityId" IS NOT NULL
		  AND "Members"."permissions" = 'manage'
		  AND (${domainWhere})
		GROUP BY "Members"."communityId"
	`;

	// 3. Find authors (PubAttribution + Pub) matching any domain
	const authorsQuery = `
		SELECT
			"Pubs"."communityId" AS "communityId",
			COUNT(DISTINCT "PubAttributions"."userId") AS "authorCount"
		FROM "PubAttributions"
		INNER JOIN "Pubs" ON "Pubs"."id" = "PubAttributions"."pubId"
		INNER JOIN "Users" ON "Users"."id" = "PubAttributions"."userId"
		WHERE "PubAttributions"."isAuthor" = true
		  AND "PubAttributions"."userId" IS NOT NULL
		  AND (${domainWhere})
		GROUP BY "Pubs"."communityId"
	`;

	// 3b. Find pubs that have at least one domain-matching attribution
	const pubsQuery = `
		SELECT
			"Pubs"."communityId" AS "communityId",
			COUNT(DISTINCT "Pubs"."id") AS "pubCount"
		FROM "PubAttributions"
		INNER JOIN "Pubs" ON "Pubs"."id" = "PubAttributions"."pubId"
		INNER JOIN "Users" ON "Users"."id" = "PubAttributions"."userId"
		WHERE "PubAttributions"."isAuthor" = true
		  AND "PubAttributions"."userId" IS NOT NULL
		  AND (${domainWhere})
		GROUP BY "Pubs"."communityId"
	`;

	// 4. Run all three in parallel
	const [managerRows, authorRows, pubRows] = await Promise.all([
		sequelize.query<{ communityId: string; managerCount: string }>(managersQuery, {
			replacements: domainReplacements,
			type: QueryTypes.SELECT,
		}),
		sequelize.query<{ communityId: string; authorCount: string }>(authorsQuery, {
			replacements: domainReplacements,
			type: QueryTypes.SELECT,
		}),
		sequelize.query<{ communityId: string; pubCount: string }>(pubsQuery, {
			replacements: domainReplacements,
			type: QueryTypes.SELECT,
		}),
	]);

	// 5. Merge into a community → counts map
	const communityMap = new Map<
		string,
		{ managerCount: number; authorCount: number; pubCount: number }
	>();
	for (const row of managerRows) {
		const entry = communityMap.get(row.communityId) || {
			managerCount: 0,
			authorCount: 0,
			pubCount: 0,
		};
		entry.managerCount = parseInt(row.managerCount as any, 10);
		communityMap.set(row.communityId, entry);
	}
	for (const row of authorRows) {
		const entry = communityMap.get(row.communityId) || {
			managerCount: 0,
			authorCount: 0,
			pubCount: 0,
		};
		entry.authorCount = parseInt(row.authorCount as any, 10);
		communityMap.set(row.communityId, entry);
	}
	for (const row of pubRows) {
		const entry = communityMap.get(row.communityId) || {
			managerCount: 0,
			authorCount: 0,
			pubCount: 0,
		};
		entry.pubCount = parseInt(row.pubCount as any, 10);
		communityMap.set(row.communityId, entry);
	}

	if (communityMap.size === 0) return [];

	const communityIds = [...communityMap.keys()];
	const placeholders = communityIds.map((_, i) => `:cid${i}`).join(', ');
	const replacements: Record<string, string> = {};
	communityIds.forEach((cid, i) => {
		replacements[`cid${i}`] = cid;
	});
	replacements.orgId = hubId;

	// 6. Fetch community info (excluding opted-out communities)
	const communityQuery = `
		SELECT
			"Communities"."id" AS "communityId",
			"Communities"."title",
			"Communities"."subdomain",
			"Communities"."domain",
			"Communities"."description",
			"Communities"."heroLogo",
			"Communities"."accentColorDark",
			"Communities"."accentColorLight",
			"Communities"."createdAt",
			CASE WHEN oc."communityId" IS NOT NULL THEN true ELSE false END AS "alreadyAdded"
		FROM "Communities"
		LEFT JOIN "HubCommunities" oc
			ON oc."communityId" = "Communities"."id"
			AND oc."hubId" = :orgId
		LEFT JOIN "HubOptOuts" coo
			ON coo."communityId" = "Communities"."id"
			AND coo."hubId" = :orgId
		LEFT JOIN "SpamTags" st
			ON st."id" = "Communities"."spamTagId"
		WHERE "Communities"."id" IN (${placeholders})
		  AND coo."id" IS NULL
		  AND (st."status" IS NULL OR st."status" != 'confirmed')
		ORDER BY "Communities"."title" ASC
	`;

	const communityRows = await sequelize.query<{
		communityId: string;
		title: string;
		subdomain: string;
		domain: string | null;
		description: string | null;
		heroLogo: string | null;
		accentColorDark: string | null;
		accentColorLight: string | null;
		createdAt: string;
		alreadyAdded: boolean;
	}>(communityQuery, {
		replacements,
		type: QueryTypes.SELECT,
	});

	// 7. Assemble final results
	return communityRows.map((c) => {
		const counts = communityMap.get(c.communityId) || {
			managerCount: 0,
			authorCount: 0,
			pubCount: 0,
		};
		return {
			communityId: c.communityId,
			title: c.title,
			subdomain: c.subdomain,
			domain: c.domain,
			description: c.description,
			heroLogo: c.heroLogo,
			accentColorDark: c.accentColorDark,
			accentColorLight: c.accentColorLight,
			createdAt: c.createdAt,
			pubCount: counts.pubCount,
			managerCount: counts.managerCount,
			authorCount: counts.authorCount,
			alreadyAdded: c.alreadyAdded === true || (c.alreadyAdded as any) === 'true',
		};
	});
};
