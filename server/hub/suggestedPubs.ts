/**
 * Suggested-pub discovery for a Hub's configured pubSearchTerms.
 *
 * For each term in Hub.pubSearchTerms we run a full-text search against the
 * Pubs.searchVector column (GIN-indexed, maintained by triggers). Results
 * include a ts_headline snippet showing where the match occurred.
 *
 * Only publicly released pubs are returned. Spam communities are excluded.
 */
import { QueryTypes } from 'sequelize';

import { sequelize } from 'server/sequelize';

export type SuggestedPub = {
	id: string;
	title: string;
	slug: string;
	avatar: string | null;
	description: string | null;
	communityId: string;
	communityTitle: string;
	communitySlug: string;
	communityDomain: string | null;
	byline: string | null;
	snippet: string | null;
	rank: number;
	publishedAt: string | null;
	/** true if this pub is already in HubPubs for this hub */
	alreadyAdded: boolean;
};

export type SuggestedPubsResult = {
	pubs: SuggestedPub[];
	total: number;
};

/**
 * Sanitize user input into a tsquery with phrase matching.
 * e.g. "Mellon Foundation" -> "mellon <-> foundation"
 * Single words get prefix matching: "mellon" -> "mellon:*"
 */
const buildTsQuery = (searchTerm: string): string | null => {
	const sanitized = searchTerm
		.trim()
		.toLowerCase()
		.replace(/[^\w\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	const terms = sanitized.split(/\s+/).filter(Boolean);
	if (terms.length === 0) return null;
	if (terms.length === 1) return `${terms[0]}:*`;
	return terms.join(' <-> ');
};

/**
 * Get suggested pubs for a hub based on its configured pubSearchTerms.
 * Searches across all publicly released pubs using the pre-computed tsvector.
 */
export const getSuggestedPubs = async (
	hubId: string,
	opts: { limit?: number; offset?: number; excludeCommunityIds?: string[] } = {},
): Promise<SuggestedPubsResult> => {
	const limit = opts.limit ?? 50;
	const offset = opts.offset ?? 0;
	const excludeCommunityIds = opts.excludeCommunityIds ?? [];
	// 1. Get the hub's configured search terms
	const hub = await sequelize.query<{ pubSearchTerms: string[] | null }>(
		`SELECT "pubSearchTerms" FROM "Hubs" WHERE "id" = :hubId`,
		{ replacements: { hubId }, type: QueryTypes.SELECT },
	);
	const searchTerms = (hub[0]?.pubSearchTerms ?? []).filter(Boolean);
	if (searchTerms.length === 0) return { pubs: [], total: 0 };

	// 2. Build combined tsquery from all terms (OR them together for broader matches)
	const tsQueries = searchTerms.map((t) => buildTsQuery(t)).filter(Boolean) as string[];
	if (tsQueries.length === 0) return { pubs: [], total: 0 };

	// Combine with OR so any term matches
	const combinedTsQuery = tsQueries.map((q) => `(${q})`).join(' | ');

	// 3. Search pubs using a CTE approach:
	//    Phase 1 (matched_pubs): fast GIN-index scan to find matching pubs
	//    Phase 2 (with_doc_text): extract plain text from the latest release doc JSONB
	//    Final SELECT: run ts_headline and include total count via window function
	const query = `
		WITH matched_pubs AS (
			SELECT
				p.id,
				p.title,
				p.slug,
				p.avatar,
				p.description,
				p."communityId",
				p."customPublishedAt",
				c.title AS "communityTitle",
				c.subdomain AS "communitySlug",
				c.domain AS "communityDomain",
				ts_rank_cd(p."searchVector", to_tsquery('english', :tsQuery)) AS rank,
				CASE WHEN hp.id IS NOT NULL THEN true ELSE false END AS "alreadyAdded",
				(
					SELECT string_agg(COALESCE(u."fullName", pa.name), ', ' ORDER BY pa."order")
					FROM "PubAttributions" pa
					LEFT JOIN "Users" u ON u.id = pa."userId"
					WHERE pa."pubId" = p.id AND pa."isAuthor" = true
					  AND (pa.name IS NOT NULL OR u."fullName" IS NOT NULL)
				) AS byline
			FROM "Pubs" p
			INNER JOIN "Communities" c ON c.id = p."communityId"
			LEFT JOIN "SpamTags" st ON st.id = c."spamTagId"
			LEFT JOIN "HubPubs" hp ON hp."pubId" = p.id AND hp."hubId" = :hubId
			WHERE (st.status IS NULL OR st.status != 'confirmed')
			  AND p."searchVector" IS NOT NULL
			  AND p."searchVector" @@ to_tsquery('english', :tsQuery)
			  AND EXISTS (SELECT 1 FROM "Releases" r WHERE r."pubId" = p.id)
			  ${excludeCommunityIds.length > 0 ? 'AND p."communityId" NOT IN (:excludeCommunityIds)' : ''}
			ORDER BY rank DESC
			LIMIT 200
		),
		with_doc_text AS (
			SELECT
				mp.*,
				COALESCE(mp."customPublishedAt", (
					SELECT MIN(r."createdAt") FROM "Releases" r WHERE r."pubId" = mp.id
				)) AS "publishedAt",
				left(extract_doc_text(d.content), 8000) AS doc_text
			FROM matched_pubs mp
			LEFT JOIN LATERAL (
				SELECT doc.content
				FROM "Releases" rel
				INNER JOIN "Docs" doc ON doc.id = rel."docId"
				WHERE rel."pubId" = mp.id
				ORDER BY rel."createdAt" DESC
				LIMIT 1
			) d ON true
		)
		SELECT
			id, title, slug, avatar, description,
			"communityId", "communityTitle", "communitySlug", "communityDomain",
			rank, "alreadyAdded", "publishedAt", byline,
			ts_headline(
				'english',
				COALESCE(title, '') || ' — ' || COALESCE(description, '') || ' — ' || COALESCE(doc_text, ''),
				to_tsquery('english', :tsQuery),
				'MaxFragments=2, MaxWords=50, MinWords=15, StartSel=<mark>, StopSel=</mark>'
			) AS snippet,
			count(*) OVER() AS "totalCount"
		FROM with_doc_text
		ORDER BY rank DESC
		LIMIT :limit OFFSET :offset
	`;

	const replacements: Record<string, any> = { tsQuery: combinedTsQuery, hubId, limit, offset };
	if (excludeCommunityIds.length > 0) {
		replacements.excludeCommunityIds = excludeCommunityIds;
	}

	const results = await sequelize.query<SuggestedPub & { totalCount: string }>(query, {
		replacements,
		type: QueryTypes.SELECT,
	});

	const total = results.length > 0 ? parseInt(String(results[0].totalCount), 10) : 0;
	const pubs = results.map(({ totalCount: _, ...rest }) => rest) as SuggestedPub[];

	return { pubs, total };
};
