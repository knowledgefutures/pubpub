import { QueryTypes } from 'sequelize';

import { sequelize } from 'server/sequelize';

import { KNOWN_SEARCH_TERMS } from './knownSearchTerms';

export type ContentSearchSummary = {
	index: number;
	name: string;
	pubCount: number;
	communityCount: number;
};

export type ContentSearchPub = {
	id: string;
	title: string;
	slug: string;
	communityId: string;
	communitySubdomain: string;
	communityTitle: string;
	byline: string | null;
	matchContext: string | null;
	publishedAt: string | null;
};

/**
 * Get pub counts for all known search terms using the GIN-indexed searchVector.
 *
 * Uses phraseto_tsquery to match aliases as phrase searches against the
 * pre-computed tsvector on Pubs. Each alias becomes a row in a VALUES CTE;
 * multiple aliases for the same term share an index and are deduplicated
 * via COUNT(DISTINCT).
 */
export async function getContentSearchCounts(): Promise<ContentSearchSummary[]> {
	const valuesRows: string[] = [];
	const replacements: Record<string, string | number> = {};

	KNOWN_SEARCH_TERMS.forEach((term, fi) => {
		term.aliases.forEach((alias, ai) => {
			const key = `a_${fi}_${ai}`;
			valuesRows.push(`(:fi_${fi}_${ai}::int, :${key}::text)`);
			replacements[`fi_${fi}_${ai}`] = fi;
			replacements[key] = alias;
		});
	});

	const query = `
		WITH search_aliases(idx, alias_text) AS (
			VALUES ${valuesRows.join(', ')}
		)
		SELECT
			sa.idx,
			COUNT(DISTINCT p.id)::int AS "pubCount",
			COUNT(DISTINCT p."communityId")::int AS "communityCount"
		FROM search_aliases sa
		INNER JOIN "Pubs" p
			ON p."searchVector" @@ phraseto_tsquery('english', sa.alias_text)
			AND p."searchVector" IS NOT NULL
		INNER JOIN "Communities" c ON c.id = p."communityId"
		LEFT JOIN "SpamTags" st ON st.id = c."spamTagId"
		WHERE (st.status IS NULL OR st.status != 'confirmed')
		  AND EXISTS (SELECT 1 FROM "Releases" r WHERE r."pubId" = p.id)
		GROUP BY sa.idx
	`;

	const rows = await sequelize.query(query, {
		replacements,
		type: QueryTypes.SELECT,
	});

	const countsByIndex = new Map<number, { pubCount: number; communityCount: number }>();
	for (const row of rows as any[]) {
		countsByIndex.set(row.idx, {
			pubCount: row.pubCount,
			communityCount: row.communityCount,
		});
	}

	return KNOWN_SEARCH_TERMS.map((term, index) => {
		const counts = countsByIndex.get(index);
		return {
			index,
			name: term.name,
			pubCount: counts?.pubCount ?? 0,
			communityCount: counts?.communityCount ?? 0,
		};
	});
}

/**
 * Get pubs matching a specific known search term by index, using phrase search
 * on searchVector. Returns a text snippet (via ts_headline) showing where
 * the match occurred.
 */
export async function getContentSearchPubs(
	termIndex: number,
	{ limit = 50, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<{ pubs: ContentSearchPub[]; total: number }> {
	const term = KNOWN_SEARCH_TERMS[termIndex];
	if (!term) {
		return { pubs: [], total: 0 };
	}

	return getContentSearchPubsByAliases(term.aliases, { limit, offset });
}

/**
 * Get pubs matching an ad-hoc search phrase. Builds a phraseto_tsquery from
 * the input and searches the Pubs.searchVector GIN index.
 */
export async function getContentSearchPubsByPhrase(
	phrase: string,
	{ limit = 50, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<{ pubs: ContentSearchPub[]; total: number }> {
	const trimmed = phrase.trim();
	if (!trimmed) {
		return { pubs: [], total: 0 };
	}

	return getContentSearchPubsByAliases([trimmed], { limit, offset });
}

/**
 * Shared implementation: search pubs by one or more alias phrases.
 */
async function getContentSearchPubsByAliases(
	aliases: string[],
	{ limit = 50, offset = 0 }: { limit?: number; offset?: number },
): Promise<{ pubs: ContentSearchPub[]; total: number }> {
	const tsqParts = aliases.map((_, ai) => `phraseto_tsquery('english', :alias_${ai})`);
	const tsqExpr = tsqParts.join(' || ');

	const replacements: Record<string, string | number> = {};
	aliases.forEach((alias, ai) => {
		replacements[`alias_${ai}`] = alias;
	});
	replacements.limit = limit;
	replacements.offset = offset;

	const query = `
		WITH latest_releases AS (
			SELECT DISTINCT ON ("pubId") "pubId", "docId"
			FROM "Releases"
			ORDER BY "pubId", "createdAt" DESC
		)
		SELECT
			p.id,
			p.title,
			p.slug,
			c.id AS "communityId",
			c.subdomain AS "communitySubdomain",
			c.title AS "communityTitle",
			(
				SELECT string_agg(COALESCE(u."fullName", pa.name), ', ' ORDER BY pa."order")
				FROM "PubAttributions" pa
				LEFT JOIN "Users" u ON u.id = pa."userId"
				WHERE pa."pubId" = p.id AND pa."isAuthor" = true
				  AND (pa.name IS NOT NULL OR u."fullName" IS NOT NULL)
			) AS byline,
			ts_headline(
				'english',
				extract_doc_text(d.content),
				(${tsqExpr}),
				'StartSel=<b>, StopSel=</b>, MaxWords=50, MinWords=20, MaxFragments=2, FragmentDelimiter= … '
			) AS "matchContext",
			(
				SELECT MIN(r2."createdAt")
				FROM "Releases" r2
				WHERE r2."pubId" = p.id
			) AS "publishedAt",
			count(*) OVER() AS total
		FROM "Pubs" p
		INNER JOIN "Communities" c ON c.id = p."communityId"
		LEFT JOIN "SpamTags" st ON st.id = c."spamTagId"
		LEFT JOIN latest_releases lr ON lr."pubId" = p.id
		LEFT JOIN "Docs" d ON d.id = lr."docId"
		WHERE (st.status IS NULL OR st.status != 'confirmed')
		  AND p."searchVector" IS NOT NULL
		  AND p."searchVector" @@ (${tsqExpr})
		  AND EXISTS (SELECT 1 FROM "Releases" r WHERE r."pubId" = p.id)
		ORDER BY ts_rank_cd(p."searchVector", (${tsqExpr})) DESC
		LIMIT :limit
		OFFSET :offset
	`;

	const rows = await sequelize.query(query, {
		replacements,
		type: QueryTypes.SELECT,
	});

	const total = rows.length > 0 ? Number((rows[0] as any).total) : 0;

	const pubs: ContentSearchPub[] = (rows as any[]).map((row: any) => ({
		id: row.id,
		title: row.title,
		slug: row.slug,
		communityId: row.communityId,
		communitySubdomain: row.communitySubdomain,
		communityTitle: row.communityTitle,
		byline: row.byline,
		matchContext: row.matchContext || null,
		publishedAt: row.publishedAt || null,
	}));

	return { pubs, total };
}

/**
 * For a given institution domain, find which known search terms are mentioned
 * in the pubs authored by people at that domain. Returns counts per term.
 */
export async function getContentMentionsForDomain(
	domain: string,
): Promise<{ index: number; name: string; pubCount: number }[]> {
	const valuesRows: string[] = [];
	const replacements: Record<string, string | number> = { domain };

	KNOWN_SEARCH_TERMS.forEach((term, fi) => {
		term.aliases.forEach((alias, ai) => {
			const key = `a_${fi}_${ai}`;
			valuesRows.push(`(:fi_${fi}_${ai}::int, :${key}::text)`);
			replacements[`fi_${fi}_${ai}`] = fi;
			replacements[key] = alias;
		});
	});

	const query = `
		WITH search_aliases(idx, alias_text) AS (
			VALUES ${valuesRows.join(', ')}
		),
		domain_pubs AS (
			SELECT DISTINCT p.id
			FROM "Pubs" p
			INNER JOIN "PubAttributions" pa ON pa."pubId" = p.id AND pa."isAuthor" = true
			INNER JOIN "Users" u ON u.id = pa."userId"
			WHERE LOWER(SUBSTRING(u.email FROM '@(.+)$')) = LOWER(:domain)
			   OR LOWER(SUBSTRING(u.email FROM '@(.+)$')) LIKE LOWER('%.' || :domain)
		)
		SELECT
			sa.idx,
			COUNT(DISTINCT dp.id)::int AS "pubCount"
		FROM search_aliases sa
		INNER JOIN "Pubs" p
			ON p."searchVector" @@ phraseto_tsquery('english', sa.alias_text)
			AND p."searchVector" IS NOT NULL
		INNER JOIN domain_pubs dp ON dp.id = p.id
		GROUP BY sa.idx
		HAVING COUNT(DISTINCT dp.id) > 0
		ORDER BY "pubCount" DESC
	`;

	const rows = await sequelize.query(query, {
		replacements,
		type: QueryTypes.SELECT,
	});

	return (rows as any[]).map((row) => ({
		index: row.idx,
		name: KNOWN_SEARCH_TERMS[row.idx].name,
		pubCount: row.pubCount,
	}));
}
