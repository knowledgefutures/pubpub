import { QueryTypes } from 'sequelize';

import { sequelize } from 'server/sequelize';

export type PubSearchResult = {
	id: string;
	title: string;
	slug: string;
	avatar: string | null;
	description: string | null;
	customPublishedAt: string | null;
	communityId: string;
	communityTitle: string;
	communitySlug: string;
	communityDomain: string | null;
	communityAvatar: string | null;
	communityAccentColorDark: string | null;
	communityAccentColorLight: string | null;
	communityHeaderLogo: string | null;
	communityTextColor: string | null;
	byline: string | null;
	rank: number;
};

export type CommunitySearchResult = {
	id: string;
	title: string;
	subdomain: string;
	domain: string | null;
	description: string | null;
	avatar: string | null;
	accentColorDark: string | null;
	headerLogo: string | null;
	pubCount: number;
	rank: number;
};

export type SearchFields = 'title' | 'description' | 'byline' | 'content';

type AuthorFacet = { name: string; count: number };

/**
 * Sanitize user input into a tsquery with prefix matching.
 * e.g. "hello world" -> "hello:* & world:*"
 */
const buildTsQuery = (searchTerm: string): string | null => {
	const sanitized = searchTerm
		.trim()
		.toLowerCase()
		.replace(/[^\w\s]/g, ' ') // strip all non-word, non-space chars (incl. hyphens)
		.replace(/\s+/g, ' ')
		.trim();
	const terms = sanitized.split(/\s+/).filter(Boolean);
	if (terms.length === 0) return null;
	return terms.map((w) => `${w}:*`).join(' & ');
};

/**
 * Map user-selected field checkboxes to tsvector weight letters.
 *
 *   title       -> A
 *   description -> B
 *   byline      -> C
 *   content     -> D
 *
 * When all weights are selected we skip the ts_rank weight mask and just use
 * the full searchVector. When a subset is selected we filter the tsquery with
 * those weights so only matching lexemes in those sections contribute.
 */
const FIELD_WEIGHTS: Record<SearchFields, string> = {
	title: 'A',
	description: 'B',
	byline: 'C',
	content: 'D',
};

const ALL_WEIGHT_LETTERS = 'ABCD';

const getWeightMask = (fields?: SearchFields[]): string => {
	if (!fields || fields.length === 0) return 'ABC'; // default: no content
	const weights = fields.map((f) => FIELD_WEIGHTS[f]).join('');
	return weights || 'ABC';
};

/**
 * Search pubs using the pre-computed searchVector column (GIN-indexed).
 *
 * The searchVector is maintained by Postgres triggers and contains weighted
 * tsvector data: A=title, B=description, C=byline, D=doc content.
 *
 * Field selection works by restricting the tsquery to specific weights.
 * Only returns publicly released pubs. Excludes spam communities.
 */
export const searchPubs = async (
	searchTerm: string,
	{
		limit = 20,
		offset = 0,
		communityId,
		fields,
		author,
	}: {
		limit?: number;
		offset?: number;
		communityId?: string;
		fields?: SearchFields[];
		author?: string;
	} = {},
): Promise<{ results: PubSearchResult[]; total: number; facets: { authors: AuthorFacet[] } }> => {
	const tsQuery = buildTsQuery(searchTerm);
	if (!tsQuery) return { results: [], total: 0, facets: { authors: [] } };

	const weightMask = getWeightMask(fields);
	const useWeightFilter = weightMask !== ALL_WEIGHT_LETTERS;

	const communityFilter = communityId ? `AND p."communityId" = :communityId` : '';
	const authorFilter = author
		? `AND EXISTS (
			SELECT 1 FROM "PubAttributions" af
			LEFT JOIN "Users" au ON au.id = af."userId"
			WHERE af."pubId" = p.id AND af."isAuthor" = true
			  AND (af.name ILIKE :authorFilter OR au."fullName" ILIKE :authorFilter)
		)`
		: '';

	// For ranking, only use the selected weight sections so that ts_rank_cd
	// doesn't read the full tsvector (which can be very large when D=doc content
	// is present). This dramatically reduces memory/IO since Postgres only needs
	// to deserialize the filtered weights, not the entire vector.
	const rankExpr = useWeightFilter
		? `ts_filter(p."searchVector", '{${weightMask.split('').join(',')}}')`
		: `p."searchVector"`;

	const query = `
    WITH matching_pubs AS (
      SELECT
        p.id, p.title, p.slug, p.avatar, p.description, p."customPublishedAt",
        c.id AS "communityId",
        c.title AS "communityTitle",
        c.subdomain AS "communitySlug",
        c.domain AS "communityDomain",
        c.avatar AS "communityAvatar",
        c."accentColorDark" AS "communityAccentColorDark",
        c."accentColorLight" AS "communityAccentColorLight",
        c."headerLogo" AS "communityHeaderLogo",
        c."accentTextColor" AS "communityTextColor",
        ts_rank_cd(${rankExpr}, to_tsquery('english', :tsQuery)) AS rank
      FROM "Pubs" p
      INNER JOIN "Communities" c ON c.id = p."communityId"
      LEFT JOIN "SpamTags" st ON st.id = c."spamTagId"
      WHERE (st.status IS NULL OR st.status != 'confirmed')
        AND p."searchVector" IS NOT NULL
        AND p."searchVector" @@ to_tsquery('english', :tsQuery)
        AND EXISTS (SELECT 1 FROM "Releases" r WHERE r."pubId" = p.id)
        ${communityFilter}
        ${authorFilter}
    ),
    facet_data AS (
      SELECT json_agg(sub) AS facets FROM (
        SELECT COALESCE(u."fullName", pa.name) AS name, count(DISTINCT pa."pubId")::int AS count
        FROM "PubAttributions" pa
        LEFT JOIN "Users" u ON u.id = pa."userId"
        WHERE pa."pubId" IN (SELECT id FROM matching_pubs)
          AND pa."isAuthor" = true
          AND (pa.name IS NOT NULL OR u."fullName" IS NOT NULL)
        GROUP BY COALESCE(u."fullName", pa.name)
        ORDER BY count DESC, name ASC
        LIMIT 15
      ) sub
    )
    SELECT
      m.*,
      (
        SELECT string_agg(COALESCE(u."fullName", pa.name), ', ' ORDER BY pa."order")
        FROM "PubAttributions" pa
        LEFT JOIN "Users" u ON u.id = pa."userId"
        WHERE pa."pubId" = m.id AND pa."isAuthor" = true
          AND (pa.name IS NOT NULL OR u."fullName" IS NOT NULL)
      ) AS byline,
      count(*) OVER() AS total,
      (SELECT facets FROM facet_data) AS "authorFacets"
    FROM matching_pubs m
    ORDER BY rank DESC
    LIMIT :limit
    OFFSET :offset
  `;

	const results = await sequelize.query(query, {
		replacements: {
			tsQuery,
			limit,
			offset,
			...(communityId ? { communityId } : {}),
			...(author ? { authorFilter: author } : {}),
		},
		type: QueryTypes.SELECT,
	});

	const total = results.length > 0 ? Number((results[0] as any).total) : 0;
	const authorFacetsJson = results.length > 0 ? (results[0] as any).authorFacets : null;
	const facets: { authors: AuthorFacet[] } = {
		authors: Array.isArray(authorFacetsJson) ? authorFacetsJson : [],
	};

	return {
		results: results.map((r: any) => ({
			id: r.id,
			title: r.title,
			slug: r.slug,
			avatar: r.avatar,
			description: r.description,
			customPublishedAt: r.customPublishedAt,
			communityId: r.communityId,
			communityTitle: r.communityTitle,
			communitySlug: r.communitySlug,
			communityDomain: r.communityDomain,
			communityAvatar: r.communityAvatar,
			communityAccentColorDark: r.communityAccentColorDark,
			communityAccentColorLight: r.communityAccentColorLight,
			communityHeaderLogo: r.communityHeaderLogo,
			communityTextColor: r.communityTextColor,
			byline: r.byline,
			rank: r.rank,
		})),
		total,
		facets,
	};
};

/**
 * Search communities using the pre-computed searchVector column (GIN-indexed).
 * Excludes confirmed-spam communities.
 */
export const searchCommunities = async (
	searchTerm: string,
	{ limit = 20, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<{ results: CommunitySearchResult[]; total: number }> => {
	const tsQuery = buildTsQuery(searchTerm);
	if (!tsQuery) return { results: [], total: 0 };

	const query = `
    SELECT
      c.id,
      c.title,
      c.subdomain,
      c.domain,
      c.description,
      c.avatar,
      c."accentColorDark",
      c."headerLogo",
      (
        SELECT count(DISTINCT p.id)::int
        FROM "Pubs" p
        WHERE p."communityId" = c.id
          AND EXISTS (SELECT 1 FROM "Releases" r WHERE r."pubId" = p.id)
      ) AS "pubCount",
      ts_rank_cd(c."searchVector", to_tsquery('english', :tsQuery))
        + ln(1 + (
          SELECT count(DISTINCT p.id)
          FROM "Pubs" p
          WHERE p."communityId" = c.id
            AND EXISTS (SELECT 1 FROM "Releases" r WHERE r."pubId" = p.id)
        )) AS rank,
      count(*) OVER() AS total
    FROM "Communities" c
    LEFT JOIN "SpamTags" st ON st.id = c."spamTagId"
    WHERE (st.status IS NULL OR st.status != 'confirmed')
      AND c."searchVector" IS NOT NULL
      AND c."searchVector" @@ to_tsquery('english', :tsQuery)
    ORDER BY rank DESC
    LIMIT :limit
    OFFSET :offset
  `;

	const results = await sequelize.query(query, {
		replacements: { tsQuery, limit, offset },
		type: QueryTypes.SELECT,
	});

	const total = results.length > 0 ? Number((results[0] as any).total) : 0;

	return {
		results: results.map((r: any) => ({
			id: r.id,
			title: r.title,
			subdomain: r.subdomain,
			domain: r.domain,
			description: r.description,
			avatar: r.avatar,
			accentColorDark: r.accentColorDark,
			headerLogo: r.headerLogo,
			pubCount: r.pubCount,
			rank: r.rank,
		})),
		total,
	};
};
