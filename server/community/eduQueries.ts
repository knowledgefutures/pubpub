import { QueryTypes } from 'sequelize';

import { sequelize } from 'server/sequelize';

/**
 * Academic/university email domain patterns used worldwide.
 * Covers .edu (US) plus international academic TLDs.
 */
export const ACADEMIC_DOMAIN_PATTERNS = [
	// US / generic
	'%.edu',
	// UK, Japan, South Korea, New Zealand, South Africa, Israel, Thailand,
	// Indonesia, Belgium, Austria
	'%.ac.uk',
	'%.ac.jp',
	'%.ac.kr',
	'%.ac.nz',
	'%.ac.za',
	'%.ac.il',
	'%.ac.th',
	'%.ac.id',
	'%.ac.be',
	'%.ac.at',
	'%.ac.in',
	'%.ac.ir',
	'%.ac.ke',
	'%.ac.tz',
	'%.ac.ug',
	'%.ac.rw',
	'%.ac.cy',
	'%.ac.lk',
	'%.ac.bd',
	// Country-specific .edu.XX
	'%.edu.au',
	'%.edu.cn',
	'%.edu.br',
	'%.edu.mx',
	'%.edu.in',
	'%.edu.sg',
	'%.edu.co',
	'%.edu.ar',
	'%.edu.tw',
	'%.edu.hk',
	'%.edu.ph',
	'%.edu.my',
	'%.edu.pk',
	'%.edu.ng',
	'%.edu.eg',
	'%.edu.tr',
	'%.edu.sa',
	'%.edu.pl',
	'%.edu.pe',
	'%.edu.uy',
	'%.edu.ec',
	'%.edu.vn',
	'%.edu.gh',
	'%.edu.et',
	'%.edu.lb',
	'%.edu.jo',
	'%.edu.qa',
	'%.edu.om',
	'%.edu.kw',
	'%.edu.bh',
	'%.edu.ru',
	'%.edu.ua',
	'%.edu.ge',
	// European academic patterns
	'%.uni-%.de', // German universities (uni-heidelberg.de, etc.)
	'%.tu-%.de', // German technical universities
	'%.u-%.fr', // French universities
	'%.univ-%.fr', // French universities
] as const;

/** Build a SQL OR clause matching all academic domain patterns */
const buildAcademicEmailWhereClause = (emailColumn: string): string => {
	const conditions = ACADEMIC_DOMAIN_PATTERNS.map(
		(pattern) => `LOWER(${emailColumn}) LIKE '${pattern}'`,
	);
	return `(${conditions.join(' OR ')})`;
};

/** Simple SQL expression: extract raw domain from email */
const rawDomainSql = (emailExpr: string = 'u.email'): string =>
	`LOWER(SUBSTRING(${emailExpr} FROM '@(.+)$'))`;

/**
 * Normalise a raw email domain to its root institution in JS.
 * e.g. "media.mit.edu" → "mit.edu", "cs.ox.ac.uk" → "ox.ac.uk"
 *
 * Strategy: for each known academic TLD suffix, keep the suffix + one label.
 * Wildcard patterns (e.g. uni-%.de) are left as-is.
 */
const SUFFIX_LIST: string[] = ACADEMIC_DOMAIN_PATTERNS.map((p) => p.replace(/^%\./, '')).filter(
	(p) => !p.includes('%'),
);

export const normalizeDomain = (raw: string | null | undefined): string => {
	if (!raw) return '';
	const d = raw.toLowerCase();
	for (const suffix of SUFFIX_LIST) {
		if (d.endsWith(`.${suffix}`) || d === suffix) {
			// grab the label just before the suffix
			const prefix = d.slice(0, -(suffix.length + 1)); // strip ".suffix"
			if (!prefix) return d; // already root
			const lastDot = prefix.lastIndexOf('.');
			const label = lastDot === -1 ? prefix : prefix.slice(lastDot + 1);
			return `${label}.${suffix}`;
		}
	}
	return d;
};

/**
 * Build a SQL WHERE clause that matches a normalised domain,
 * catching all possible subdomains.
 * e.g. for "mit.edu" → (domain = 'mit.edu' OR domain LIKE '%.mit.edu')
 */
const buildDomainMatchWhere = (domainColumn: string, normalised: string): string => {
	const safe = normalised.toLowerCase().replace(/'/g, "''");
	return `(${domainColumn} = '${safe}' OR ${domainColumn} LIKE '%.${safe}')`;
};

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type EduPerson = {
	userId: string;
	fullName: string;
	email: string;
	avatar: string | null;
	orcid: string | null;
	/** Roles this person has across the domain */
	roles: ('admin' | 'author' | 'reviewer' | 'commenter')[];
	adminCommunityCount: number;
	authoredPubCount: number;
	discussionCount: number;
	reviewCount: number;
};

export type EduCommunity = {
	communityId: string;
	communityTitle: string;
	communitySubdomain: string;
	communityAvatar: string | null;
	communityDescription: string | null;
	communityCreatedAt: string;
	pubCount: number;
	totalMembers: number;
	/** People from this domain who admin/manage this community */
	admins: EduPersonRef[];
	/** People from this domain who authored pubs in this community */
	authors: EduPersonRef[];
};

export type EduPersonRef = {
	userId: string;
	fullName: string;
	email: string;
	avatar: string | null;
};

export type EduDomainGroup = {
	domain: string;
	/** Summary counts */
	adminCount: number;
	authorCount: number;
	reviewerCount: number;
	commenterCount: number;
	totalPeopleCount: number;
	communityAdminCount: number;
	communityAuthorCount: number;
	authoredPubCount: number;
	/** All communities touched by this domain (admin OR author) */
	communities: EduCommunity[];
	/** All unique people at this domain, with activity summary */
	people: EduPerson[];
};

/** Lightweight summary for the sidebar — no nested communities/people */
export type EduDomainSummary = {
	domain: string;
	totalPeopleCount: number;
	adminCount: number;
	authorCount: number;
	communityCount: number;
	authoredPubCount: number;
};

/** Cross-institution collaborator record */
export type EduCollaborator = {
	/** The other institution's (normalised) domain */
	collaboratorDomain: string;
	/** Number of distinct co-authored pubs shared between the two domains */
	sharedPubCount: number;
	/** Number of distinct people at that other domain who co-authored with this domain */
	collaboratorCount: number;
};

/* ------------------------------------------------------------------ */
/* Sidebar summary query (fast — no nested data)                      */
/* ------------------------------------------------------------------ */

export const getEduDomainSummaries = async (
	opts: { publicOnly?: boolean } = {},
): Promise<EduDomainSummary[]> => {
	const { publicOnly = false } = opts;
	const academicWhere = buildAcademicEmailWhereClause('u.email');

	// CTE runs the TLD matching once, then simple joins for counts.
	// Domain normalisation (subdomain stripping) happens in JS after the query.
	const domainExpr = rawDomainSql('u.email');

	// publicOnly filters
	const authorReleaseFilter = publicOnly
		? 'AND EXISTS (SELECT 1 FROM "Releases" rel WHERE rel."pubId" = pa."pubId")'
		: '';
	const discussionVisJoin = publicOnly ? 'JOIN "Visibilities" v ON v.id = d."visibilityId"' : '';
	const discussionVisWhere = publicOnly ? "AND v.access = 'public'" : '';

	const rows = await sequelize.query<{
		domain: string;
		totalPeople: string;
		adminCount: string;
		authorCount: string;
		communityCount: string;
		authoredPubCount: string;
	}>(
		`
		WITH edu_users AS (
			SELECT id, ${domainExpr} AS domain
			FROM "Users" u
			WHERE ${academicWhere}
		),
		admin_agg AS (
			SELECT eu.domain,
				COUNT(DISTINCT eu.id) AS cnt,
				COUNT(DISTINCT m."communityId") AS comm_cnt
			FROM edu_users eu
			JOIN "Members" m ON m."userId" = eu.id
			WHERE m."communityId" IS NOT NULL
			  AND (m.permissions IN ('admin', 'manage') OR m."isOwner" = true)
			GROUP BY eu.domain
		),
		author_agg AS (
			SELECT eu.domain,
				COUNT(DISTINCT eu.id) AS cnt,
				COUNT(DISTINCT pa."pubId") AS pub_cnt,
				COUNT(DISTINCT p."communityId") AS comm_cnt
			FROM edu_users eu
			JOIN "PubAttributions" pa ON pa."userId" = eu.id
			JOIN "Pubs" p ON p.id = pa."pubId"
			WHERE 1=1 ${authorReleaseFilter}
			GROUP BY eu.domain
		),
		people_agg AS (
			SELECT domain, COUNT(DISTINCT user_id) AS cnt FROM (
				SELECT eu.id AS user_id, eu.domain FROM edu_users eu
				JOIN "Members" m ON m."userId" = eu.id
				WHERE m."communityId" IS NOT NULL
				  AND (m.permissions IN ('admin', 'manage') OR m."isOwner" = true)
				UNION
				SELECT eu.id, eu.domain FROM edu_users eu
				JOIN "PubAttributions" pa ON pa."userId" = eu.id
				WHERE 1=1 ${authorReleaseFilter}
				UNION
				SELECT eu.id, eu.domain FROM edu_users eu
				JOIN "Discussions" d ON d."userId" = eu.id
				${discussionVisJoin}
				WHERE 1=1 ${discussionVisWhere}
				UNION
				SELECT eu.id, eu.domain FROM edu_users eu
				JOIN "ReviewNews" r ON r."userId" = eu.id
			) active_users
			GROUP BY domain
		)
		SELECT
			pa.domain,
			pa.cnt::text AS "totalPeople",
			COALESCE(aa.cnt, 0)::text AS "adminCount",
			COALESCE(aua.cnt, 0)::text AS "authorCount",
			(COALESCE(aa.comm_cnt, 0) + COALESCE(aua.comm_cnt, 0))::text AS "communityCount",
			COALESCE(aua.pub_cnt, 0)::text AS "authoredPubCount"
		FROM people_agg pa
		LEFT JOIN admin_agg aa ON aa.domain = pa.domain
		LEFT JOIN author_agg aua ON aua.domain = pa.domain
		WHERE pa.domain IS NOT NULL
		ORDER BY pa.cnt DESC, COALESCE(aua.pub_cnt, 0) DESC
		`,
		{ type: QueryTypes.SELECT },
	);

	// Aggregate raw-domain rows by normalised domain in JS
	const aggregated = new Map<string, EduDomainSummary>();
	for (const r of rows) {
		const norm = normalizeDomain(r.domain);
		if (!norm) continue;
		const existing = aggregated.get(norm);
		if (existing) {
			existing.totalPeopleCount += parseInt(r.totalPeople, 10);
			existing.adminCount += parseInt(r.adminCount, 10);
			existing.authorCount += parseInt(r.authorCount, 10);
			existing.communityCount += parseInt(r.communityCount, 10);
			existing.authoredPubCount += parseInt(r.authoredPubCount, 10);
		} else {
			aggregated.set(norm, {
				domain: norm,
				totalPeopleCount: parseInt(r.totalPeople, 10),
				adminCount: parseInt(r.adminCount, 10),
				authorCount: parseInt(r.authorCount, 10),
				communityCount: parseInt(r.communityCount, 10),
				authoredPubCount: parseInt(r.authoredPubCount, 10),
			});
		}
	}
	const result = [...aggregated.values()];
	result.sort(
		(a, b) =>
			b.totalPeopleCount - a.totalPeopleCount || b.authoredPubCount - a.authoredPubCount,
	);
	return result;
};

/* ------------------------------------------------------------------ */
/* Full detail query (for a single domain)                            */
/* ------------------------------------------------------------------ */

export const getEduDomainDetailData = async (
	opts: { publicOnly?: boolean; domain?: string } = {},
): Promise<EduDomainGroup[]> => {
	const { publicOnly = true, domain } = opts;
	const domainExpr = rawDomainSql('u.email');
	const academicWhere = domain
		? buildDomainMatchWhere(domainExpr, domain)
		: buildAcademicEmailWhereClause('u.email');

	// Conditional filters for public-only mode
	const releaseFilter = publicOnly
		? 'AND EXISTS (SELECT 1 FROM "Releases" rel WHERE rel."pubId" = p.id)'
		: '';
	const discussionVisibilityJoin = publicOnly
		? 'JOIN "Visibilities" v ON v.id = d."visibilityId"'
		: '';
	const discussionVisibilityWhere = publicOnly ? "AND v.access = 'public'" : '';
	const pubCountReleaseFilter = publicOnly
		? 'AND EXISTS (SELECT 1 FROM "Releases" rel WHERE rel."pubId" = p.id)'
		: '';

	// Run all 4 queries in parallel instead of sequentially
	const [adminRows, authorRows, discussionRows, reviewRows] = await Promise.all([
		// 1. Admin/manager members at academic institutions
		sequelize.query<{
			communityId: string;
			communityTitle: string;
			communitySubdomain: string;
			communityAvatar: string | null;
			communityDescription: string | null;
			communityCreatedAt: string;
			userId: string;
			fullName: string;
			email: string;
			userAvatar: string | null;
			orcid: string | null;
			eduDomain: string;
		}>(
			`
			SELECT DISTINCT
				c.id AS "communityId",
				c.title AS "communityTitle",
				c.subdomain AS "communitySubdomain",
				c.avatar AS "communityAvatar",
				c.description AS "communityDescription",
				c."createdAt" AS "communityCreatedAt",
				u.id AS "userId",
				u."fullName" AS "fullName",
				u.email AS "email",
				u.avatar AS "userAvatar",
				u.orcid AS "orcid",
				${domainExpr} AS "eduDomain"
			FROM "Members" m
			JOIN "Users" u ON u.id = m."userId"
			JOIN "Communities" c ON c.id = m."communityId"
			WHERE m."communityId" IS NOT NULL
			  AND (m.permissions IN ('admin', 'manage') OR m."isOwner" = true)
			  AND ${academicWhere}
			`,
			{ type: QueryTypes.SELECT },
		),

		// 2. Authors/contributors at academic institutions (via PubAttribution → Pub → Community)
		sequelize.query<{
			communityId: string;
			communityTitle: string;
			communitySubdomain: string;
			communityAvatar: string | null;
			communityDescription: string | null;
			communityCreatedAt: string;
			pubId: string;
			userId: string;
			fullName: string;
			email: string;
			userAvatar: string | null;
			orcid: string | null;
			eduDomain: string;
		}>(
			`
			SELECT DISTINCT
				c.id AS "communityId",
				c.title AS "communityTitle",
				c.subdomain AS "communitySubdomain",
				c.avatar AS "communityAvatar",
				c.description AS "communityDescription",
				c."createdAt" AS "communityCreatedAt",
				p.id AS "pubId",
				u.id AS "userId",
				u."fullName" AS "fullName",
				u.email AS "email",
				u.avatar AS "userAvatar",
				u.orcid AS "orcid",
				${domainExpr} AS "eduDomain"
			FROM "PubAttributions" pa
			JOIN "Users" u ON u.id = pa."userId"
			JOIN "Pubs" p ON p.id = pa."pubId"
			JOIN "Communities" c ON c.id = p."communityId"
			WHERE pa."userId" IS NOT NULL
			  ${releaseFilter}
			  AND ${academicWhere}
			`,
			{ type: QueryTypes.SELECT },
		),

		// 3. Discussion starters (academic users who opened discussions)
		sequelize.query<{
			userId: string;
			fullName: string;
			email: string;
			userAvatar: string | null;
			orcid: string | null;
			eduDomain: string;
			count: string;
		}>(
			`
			SELECT
				u.id AS "userId",
				u."fullName" AS "fullName",
				u.email AS "email",
				u.avatar AS "userAvatar",
				u.orcid AS "orcid",
				${domainExpr} AS "eduDomain",
				COUNT(*)::text AS count
			FROM "Discussions" d
			JOIN "Users" u ON u.id = d."userId"
			${discussionVisibilityJoin}
			WHERE d."userId" IS NOT NULL
			  ${discussionVisibilityWhere}
			  AND ${academicWhere}
			GROUP BY u.id, u."fullName", u.email, u.avatar, u.orcid
			`,
			{ type: QueryTypes.SELECT },
		),

		// 4. Reviews (academic users who created reviews)
		sequelize.query<{
			userId: string;
			fullName: string;
			email: string;
			userAvatar: string | null;
			orcid: string | null;
			eduDomain: string;
			count: string;
		}>(
			`
			SELECT
				u.id AS "userId",
				u."fullName" AS "fullName",
				u.email AS "email",
				u.avatar AS "userAvatar",
				u.orcid AS "orcid",
				${domainExpr} AS "eduDomain",
				COUNT(*)::text AS count
			FROM "ReviewNews" r
			JOIN "Users" u ON u.id = r."userId"
			WHERE r."userId" IS NOT NULL
			  AND ${academicWhere}
			GROUP BY u.id, u."fullName", u.email, u.avatar, u.orcid
			`,
			{ type: QueryTypes.SELECT },
		),
	]);

	// 5. Pub counts + member counts per community (bulk)
	const allCommunityIds = new Set<string>();
	for (const r of adminRows) allCommunityIds.add(r.communityId);
	for (const r of authorRows) allCommunityIds.add(r.communityId);
	const communityIds = [...allCommunityIds];

	let pubCountMap: Record<string, number> = {};
	let memberCountMap: Record<string, number> = {};

	if (communityIds.length > 0) {
		const [pubCounts, memberCounts] = await Promise.all([
			sequelize.query<{ communityId: string; count: string }>(
				`SELECT p."communityId", COUNT(*)::text AS count FROM "Pubs" p
				 WHERE p."communityId" IN (:communityIds)
				   ${pubCountReleaseFilter}
				 GROUP BY p."communityId"`,
				{ type: QueryTypes.SELECT, replacements: { communityIds } },
			),
			sequelize.query<{ communityId: string; count: string }>(
				`SELECT "communityId", COUNT(DISTINCT "userId")::text AS count FROM "Members"
				 WHERE "communityId" IN (:communityIds) AND "communityId" IS NOT NULL
				 GROUP BY "communityId"`,
				{ type: QueryTypes.SELECT, replacements: { communityIds } },
			),
		]);
		pubCountMap = Object.fromEntries(
			pubCounts.map((r) => [r.communityId, parseInt(r.count, 10)]),
		);
		memberCountMap = Object.fromEntries(
			memberCounts.map((r) => [r.communityId, parseInt(r.count, 10)]),
		);
	}

	// Build lookup maps: userId → discussion count, review count
	const discussionCountByUser = new Map<string, number>();
	for (const r of discussionRows) {
		discussionCountByUser.set(
			r.userId,
			(discussionCountByUser.get(r.userId) || 0) + parseInt(r.count, 10),
		);
	}
	const reviewCountByUser = new Map<string, number>();
	for (const r of reviewRows) {
		reviewCountByUser.set(
			r.userId,
			(reviewCountByUser.get(r.userId) || 0) + parseInt(r.count, 10),
		);
	}

	// ---- Assemble per-domain ----
	type DomainAccum = {
		communities: Map<string, EduCommunity>;
		people: Map<string, EduPerson>;
		adminCommunityIds: Set<string>;
		authorCommunityIds: Set<string>;
		authoredPubIds: Set<string>;
	};

	const domainMap = new Map<string, DomainAccum>();

	const ensureDomain = (domain: string): DomainAccum => {
		if (!domainMap.has(domain)) {
			domainMap.set(domain, {
				communities: new Map(),
				people: new Map(),
				adminCommunityIds: new Set(),
				authorCommunityIds: new Set(),
				authoredPubIds: new Set(),
			});
		}
		return domainMap.get(domain)!;
	};

	const ensureCommunity = (
		acc: DomainAccum,
		row: {
			communityId: string;
			communityTitle: string;
			communitySubdomain: string;
			communityAvatar: string | null;
			communityDescription: string | null;
			communityCreatedAt: string;
		},
	): EduCommunity => {
		if (!acc.communities.has(row.communityId)) {
			acc.communities.set(row.communityId, {
				communityId: row.communityId,
				communityTitle: row.communityTitle,
				communitySubdomain: row.communitySubdomain,
				communityAvatar: row.communityAvatar,
				communityDescription: row.communityDescription,
				communityCreatedAt: row.communityCreatedAt,
				pubCount: pubCountMap[row.communityId] || 0,
				totalMembers: memberCountMap[row.communityId] || 0,
				admins: [],
				authors: [],
			});
		}
		return acc.communities.get(row.communityId)!;
	};

	const ensurePerson = (
		acc: DomainAccum,
		row: {
			userId: string;
			fullName: string;
			email: string;
			userAvatar: string | null;
			orcid: string | null;
		},
	): EduPerson => {
		if (!acc.people.has(row.userId)) {
			acc.people.set(row.userId, {
				userId: row.userId,
				fullName: row.fullName,
				email: row.email,
				avatar: row.userAvatar,
				orcid: row.orcid,
				roles: [],
				adminCommunityCount: 0,
				authoredPubCount: 0,
				discussionCount: discussionCountByUser.get(row.userId) || 0,
				reviewCount: reviewCountByUser.get(row.userId) || 0,
			});
		}
		return acc.people.get(row.userId)!;
	};

	const personRef = (row: {
		userId: string;
		fullName: string;
		email: string;
		userAvatar: string | null;
	}): EduPersonRef => ({
		userId: row.userId,
		fullName: row.fullName,
		email: row.email,
		avatar: row.userAvatar,
	});

	// Pre-build O(1) lookup maps to avoid O(n²) .filter() calls
	// Map<"userId::domain", Set<communityId>> for admin community counts
	const adminCommCountMap = new Map<string, Set<string>>();
	for (const r of adminRows) {
		const key = `${r.userId}::${normalizeDomain(r.eduDomain)}`;
		if (!adminCommCountMap.has(key)) adminCommCountMap.set(key, new Set());
		adminCommCountMap.get(key)!.add(r.communityId);
	}

	// Map<"userId::domain", Set<pubId>> for authored pub counts
	const authorPubCountMap = new Map<string, Set<string>>();
	for (const r of authorRows) {
		const key = `${r.userId}::${normalizeDomain(r.eduDomain)}`;
		if (!authorPubCountMap.has(key)) authorPubCountMap.set(key, new Set());
		authorPubCountMap.get(key)!.add(r.pubId);
	}

	// Process admin rows
	for (const row of adminRows) {
		const nd = normalizeDomain(row.eduDomain);
		const acc = ensureDomain(nd);
		const comm = ensureCommunity(acc, row);
		const person = ensurePerson(acc, row);

		if (!comm.admins.some((a) => a.userId === row.userId)) {
			comm.admins.push(personRef(row));
		}
		if (!person.roles.includes('admin')) person.roles.push('admin');
		acc.adminCommunityIds.add(row.communityId);
		// O(1) lookup instead of O(n) filter
		person.adminCommunityCount = adminCommCountMap.get(`${row.userId}::${nd}`)?.size ?? 0;
	}

	// Process author rows
	for (const row of authorRows) {
		const nd = normalizeDomain(row.eduDomain);
		const acc = ensureDomain(nd);
		const comm = ensureCommunity(acc, row);
		const person = ensurePerson(acc, row);

		if (!comm.authors.some((a) => a.userId === row.userId)) {
			comm.authors.push(personRef(row));
		}
		if (!person.roles.includes('author')) person.roles.push('author');
		acc.authorCommunityIds.add(row.communityId);
		acc.authoredPubIds.add(row.pubId);
	}

	// Process discussion rows — materialise people who only ever discussed
	for (const row of discussionRows) {
		const acc = ensureDomain(normalizeDomain(row.eduDomain));
		const person = ensurePerson(acc, row);
		if (!person.roles.includes('commenter')) person.roles.push('commenter');
	}

	// Process review rows — materialise people who only ever reviewed
	for (const row of reviewRows) {
		const acc = ensureDomain(normalizeDomain(row.eduDomain));
		const person = ensurePerson(acc, row);
		if (!person.roles.includes('reviewer')) person.roles.push('reviewer');
	}

	// Compute authored pub counts per person per domain — O(1) lookups
	for (const [domain, acc] of domainMap) {
		for (const [userId, person] of acc.people) {
			person.authoredPubCount = authorPubCountMap.get(`${userId}::${domain}`)?.size ?? 0;
			// tag reviewer/commenter roles (for people already created via admin/author)
			if (person.discussionCount > 0 && !person.roles.includes('commenter')) {
				person.roles.push('commenter');
			}
			if (person.reviewCount > 0 && !person.roles.includes('reviewer')) {
				person.roles.push('reviewer');
			}
		}
	}

	// Build result
	const result: EduDomainGroup[] = [];
	for (const [domain, acc] of domainMap) {
		const communities = [...acc.communities.values()];
		const people = [...acc.people.values()];
		// Sort people by total activity (authored pubs + discussions + reviews)
		people.sort((a, b) => {
			const aScore =
				a.authoredPubCount + a.discussionCount + a.reviewCount + a.adminCommunityCount;
			const bScore =
				b.authoredPubCount + b.discussionCount + b.reviewCount + b.adminCommunityCount;
			return bScore - aScore;
		});
		// Sort communities by pub count descending
		communities.sort((a, b) => b.pubCount - a.pubCount);

		result.push({
			domain,
			adminCount: people.filter((p) => p.roles.includes('admin')).length,
			authorCount: people.filter((p) => p.roles.includes('author')).length,
			reviewerCount: people.filter((p) => p.roles.includes('reviewer')).length,
			commenterCount: people.filter((p) => p.roles.includes('commenter')).length,
			totalPeopleCount: people.length,
			communityAdminCount: acc.adminCommunityIds.size,
			communityAuthorCount: acc.authorCommunityIds.size,
			authoredPubCount: acc.authoredPubIds.size,
			communities,
			people,
		});
	}

	// Sort domains by total people count descending, then by authored pubs
	result.sort(
		(a, b) =>
			b.totalPeopleCount - a.totalPeopleCount || b.authoredPubCount - a.authoredPubCount,
	);

	return result;
};

/* ------------------------------------------------------------------ */
/* Cross-institution collaborator query                               */
/* ------------------------------------------------------------------ */

/**
 * For a given normalised domain, find other academic domains whose
 * people co-author pubs with people from this domain.
 * Returns a ranked list of collaborating institutions.
 */
export const getEduCollaborators = async (
	domain: string,
	opts: { publicOnly?: boolean } = {},
): Promise<EduCollaborator[]> => {
	const { publicOnly = false } = opts;
	const domainExpr = rawDomainSql('u.email');
	const domainExpr2 = rawDomainSql('u2.email');
	const domainMatchWhere = buildDomainMatchWhere(domainExpr, domain);
	const academicWhere2 = buildAcademicEmailWhereClause('u2.email');
	const releaseFilter = publicOnly
		? 'AND EXISTS (SELECT 1 FROM "Releases" rel WHERE rel."pubId" = pa."pubId")'
		: '';
	const releaseFilter2 = publicOnly
		? 'AND EXISTS (SELECT 1 FROM "Releases" rel WHERE rel."pubId" = pa2."pubId")'
		: '';

	const rows = await sequelize.query<{
		collaboratorDomain: string;
		sharedPubCount: string;
		collaboratorCount: string;
	}>(
		`
		WITH domain_pubs AS (
			-- All pubs that have at least one author from the target domain
			SELECT DISTINCT pa."pubId"
			FROM "PubAttributions" pa
			JOIN "Users" u ON u.id = pa."userId"
			WHERE pa."userId" IS NOT NULL
			  AND ${domainMatchWhere}
			  ${releaseFilter}
		),
		collab_authors AS (
			-- All authors on those pubs who are from a DIFFERENT academic domain
			SELECT
				${domainExpr2} AS collab_domain,
				pa2."pubId",
				u2.id AS user_id
			FROM "PubAttributions" pa2
			JOIN "Users" u2 ON u2.id = pa2."userId"
			WHERE pa2."pubId" IN (SELECT "pubId" FROM domain_pubs)
			  AND pa2."userId" IS NOT NULL
			  AND ${academicWhere2}
			  ${releaseFilter2}
		)
		SELECT
			collab_domain AS "collaboratorDomain",
			COUNT(DISTINCT "pubId")::text AS "sharedPubCount",
			COUNT(DISTINCT user_id)::text AS "collaboratorCount"
		FROM collab_authors
		WHERE collab_domain IS NOT NULL
		GROUP BY collab_domain
		ORDER BY COUNT(DISTINCT "pubId") DESC, COUNT(DISTINCT user_id) DESC
		`,
		{ type: QueryTypes.SELECT },
	);

	// Normalize domains in JS; aggregate rows that merge to the same institution.
	// Also exclude our own domain from results.
	const normTarget = normalizeDomain(domain);
	const aggregated = new Map<string, EduCollaborator>();
	for (const r of rows) {
		const norm = normalizeDomain(r.collaboratorDomain);
		if (!norm || norm === normTarget) continue;
		const existing = aggregated.get(norm);
		if (existing) {
			existing.sharedPubCount += parseInt(r.sharedPubCount, 10);
			existing.collaboratorCount += parseInt(r.collaboratorCount, 10);
		} else {
			aggregated.set(norm, {
				collaboratorDomain: norm,
				sharedPubCount: parseInt(r.sharedPubCount, 10),
				collaboratorCount: parseInt(r.collaboratorCount, 10),
			});
		}
	}
	const result = [...aggregated.values()];
	result.sort(
		(a, b) => b.sharedPubCount - a.sharedPubCount || b.collaboratorCount - a.collaboratorCount,
	);
	return result;
};

/* ------------------------------------------------------------------ */
/* Activity feed query                                                */
/* ------------------------------------------------------------------ */

export type ActivityEventKind = 'release' | 'community' | 'discussion' | 'review';

export type ActivityEvent = {
	kind: ActivityEventKind;
	timestamp: string;
	/** Person who performed the action */
	actorName: string;
	actorAvatar: string | null;
	actorEmail: string;
	/** Context */
	pubTitle: string | null;
	pubSlug: string | null;
	communityTitle: string;
	communitySubdomain: string;
	communityAvatar: string | null;
	/** Extra detail per kind */
	releaseNoteText: string | null;
	reviewTitle: string | null;
	reviewStatus: string | null;
	discussionTitle: string | null;
};

/**
 * Fetch a chronological activity feed for a domain.
 * Returns the most recent N events combining releases, new communities,
 * discussions, and reviews involving users at this academic domain.
 *
 * Key: "Releases" are matched via PubAttribution (pubs with domain authors),
 * not Release.userId (the person who clicked the button). "Communities" are
 * matched via both admin Members and PubAttribution authors.
 */
export const getActivityFeed = async (
	domain: string,
	opts: { publicOnly?: boolean; limit?: number } = {},
): Promise<ActivityEvent[]> => {
	const { publicOnly = false, limit = 80 } = opts;

	// We need domain matching for several user aliases
	const domainMatchU = buildDomainMatchWhere(rawDomainSql('u.email'), domain);
	const domainMatchMu = buildDomainMatchWhere(rawDomainSql('mu.email'), domain);
	const domainMatchAu = buildDomainMatchWhere(rawDomainSql('au.email'), domain);

	const discussionVisJoin = publicOnly ? 'JOIN "Visibilities" v ON v.id = d."visibilityId"' : '';
	const discussionVisWhere = publicOnly ? "AND v.access = 'public'" : '';

	// Run all 4 sub-queries in parallel
	const [releaseRows, communityRows, discussionRows, reviewRows] = await Promise.all([
		// 1. Releases of pubs with domain-affiliated AUTHORS (via PubAttribution)
		//    The actor shown is the first matched domain author (not the releaser).
		sequelize.query<{
			kind: 'release';
			timestamp: string;
			actorName: string;
			actorAvatar: string | null;
			actorEmail: string;
			pubTitle: string;
			pubSlug: string;
			communityTitle: string;
			communitySubdomain: string;
			communityAvatar: string | null;
			releaseNoteText: string | null;
		}>(
			`
			SELECT * FROM (
				SELECT DISTINCT ON (rel.id)
					'release' AS kind,
					rel."createdAt" AS timestamp,
					u."fullName" AS "actorName",
					u.avatar AS "actorAvatar",
					u.email AS "actorEmail",
					p.title AS "pubTitle",
					p.slug AS "pubSlug",
					c.title AS "communityTitle",
					c.subdomain AS "communitySubdomain",
					c.avatar AS "communityAvatar",
					rel."noteText" AS "releaseNoteText"
				FROM "Releases" rel
				JOIN "Pubs" p ON p.id = rel."pubId"
				JOIN "Communities" c ON c.id = p."communityId"
				JOIN "PubAttributions" pa ON pa."pubId" = p.id
				JOIN "Users" u ON u.id = pa."userId"
				WHERE ${domainMatchU}
				ORDER BY rel.id
			) releases
			ORDER BY releases.timestamp DESC
			LIMIT :limit
			`,
			{ type: QueryTypes.SELECT, replacements: { limit } },
		),

		// 2. Communities where domain users are admins OR authors
		sequelize.query<{
			kind: 'community';
			timestamp: string;
			actorName: string;
			actorAvatar: string | null;
			actorEmail: string;
			communityTitle: string;
			communitySubdomain: string;
			communityAvatar: string | null;
		}>(
			`
			SELECT DISTINCT ON (c.id)
				'community' AS kind,
				c."createdAt" AS timestamp,
				u."fullName" AS "actorName",
				u.avatar AS "actorAvatar",
				u.email AS "actorEmail",
				c.title AS "communityTitle",
				c.subdomain AS "communitySubdomain",
				c.avatar AS "communityAvatar"
			FROM "Communities" c
			JOIN (
				SELECT m."communityId" AS cid, m."userId" AS uid
				FROM "Members" m
				JOIN "Users" mu ON mu.id = m."userId"
				WHERE m."communityId" IS NOT NULL
				  AND (m.permissions IN ('admin', 'manage') OR m."isOwner" = true)
				  AND ${domainMatchMu}
				UNION
				SELECT p."communityId" AS cid, pa."userId" AS uid
				FROM "PubAttributions" pa
				JOIN "Users" au ON au.id = pa."userId"
				JOIN "Pubs" p ON p.id = pa."pubId"
				WHERE pa."userId" IS NOT NULL
				  AND ${domainMatchAu}
			) involved ON involved.cid = c.id
			JOIN "Users" u ON u.id = involved.uid
			ORDER BY c.id, c."createdAt" DESC
			`,
			{ type: QueryTypes.SELECT },
		),

		// 3. Discussions opened by domain users
		sequelize.query<{
			kind: 'discussion';
			timestamp: string;
			actorName: string;
			actorAvatar: string | null;
			actorEmail: string;
			pubTitle: string | null;
			pubSlug: string | null;
			communityTitle: string;
			communitySubdomain: string;
			communityAvatar: string | null;
			discussionTitle: string | null;
		}>(
			`
			SELECT
				'discussion' AS kind,
				d."createdAt" AS timestamp,
				u."fullName" AS "actorName",
				u.avatar AS "actorAvatar",
				u.email AS "actorEmail",
				p.title AS "pubTitle",
				p.slug AS "pubSlug",
				c.title AS "communityTitle",
				c.subdomain AS "communitySubdomain",
				c.avatar AS "communityAvatar",
				d.title AS "discussionTitle"
			FROM "Discussions" d
			JOIN "Users" u ON u.id = d."userId"
			JOIN "Pubs" p ON p.id = d."pubId"
			JOIN "Communities" c ON c.id = p."communityId"
			${discussionVisJoin}
			WHERE d."userId" IS NOT NULL
			  AND d."pubId" IS NOT NULL
			  ${discussionVisWhere}
			  AND ${domainMatchU}
			ORDER BY d."createdAt" DESC
			LIMIT :limit
			`,
			{ type: QueryTypes.SELECT, replacements: { limit } },
		),

		// 4. Reviews created by domain users
		sequelize.query<{
			kind: 'review';
			timestamp: string;
			actorName: string;
			actorAvatar: string | null;
			actorEmail: string;
			pubTitle: string | null;
			pubSlug: string | null;
			communityTitle: string;
			communitySubdomain: string;
			communityAvatar: string | null;
			reviewTitle: string | null;
			reviewStatus: string | null;
		}>(
			`
			SELECT
				'review' AS kind,
				r."createdAt" AS timestamp,
				u."fullName" AS "actorName",
				u.avatar AS "actorAvatar",
				u.email AS "actorEmail",
				p.title AS "pubTitle",
				p.slug AS "pubSlug",
				c.title AS "communityTitle",
				c.subdomain AS "communitySubdomain",
				c.avatar AS "communityAvatar",
				r.title AS "reviewTitle",
				r.status AS "reviewStatus"
			FROM "ReviewNews" r
			JOIN "Users" u ON u.id = r."userId"
			JOIN "Pubs" p ON p.id = r."pubId"
			JOIN "Communities" c ON c.id = p."communityId"
			WHERE r."userId" IS NOT NULL
			  AND r."pubId" IS NOT NULL
			  AND ${domainMatchU}
			ORDER BY r."createdAt" DESC
			LIMIT :limit
			`,
			{ type: QueryTypes.SELECT, replacements: { limit } },
		),
	]);

	// Merge, sort by timestamp descending, take top N
	const all: ActivityEvent[] = [
		...releaseRows.map((r) => ({
			...r,
			pubTitle: r.pubTitle,
			pubSlug: r.pubSlug,
			reviewTitle: null,
			reviewStatus: null,
			discussionTitle: null,
		})),
		...communityRows.map((r) => ({
			...r,
			pubTitle: null,
			pubSlug: null,
			releaseNoteText: null,
			reviewTitle: null,
			reviewStatus: null,
			discussionTitle: null,
		})),
		...discussionRows.map((r) => ({
			...r,
			releaseNoteText: null,
			reviewTitle: null,
			reviewStatus: null,
		})),
		...reviewRows.map((r) => ({
			...r,
			releaseNoteText: null,
			discussionTitle: null,
		})),
	];

	all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
	return all.slice(0, limit);
};
