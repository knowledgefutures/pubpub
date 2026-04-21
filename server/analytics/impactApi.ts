/**
 * API that serves analytics data for the legacy Impact dashboard directly
 * from the Postgres AnalyticsEvents table (replacing the old Metabase iframes).
 *
 * Mounted at /api/analytics-impact/...
 */

import { getCountryForTimezone } from 'countries-and-timezones';
import { Router } from 'express';
import { QueryTypes } from 'sequelize';

import { sequelize } from 'server/sequelize';
import { ForbiddenError, handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';

export const router = Router();

// ─── in-memory cache (5 min TTL) ────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { data: unknown; ts: number }>();

function cacheKey(scope: Scope, startDate: string, endDate: string) {
	return `${scope.communityId}:${scope.pubId ?? ''}:${scope.collectionId ?? ''}:${startDate}:${endDate}`;
}

function getCached(key: string): unknown | null {
	const entry = cache.get(key);
	if (entry && Date.now() - entry.ts < CACHE_TTL_MS) {
		return entry.data;
	}
	cache.delete(key);
	return null;
}

function setCache(key: string, data: unknown) {
	cache.set(key, { data, ts: Date.now() });
	// Evict stale entries lazily (keep cache bounded)
	if (cache.size > 500) {
		const now = Date.now();
		for (const [k, v] of cache) {
			if (now - v.ts > CACHE_TTL_MS) {
				cache.delete(k);
			}
		}
	}
}

// ─── types ───────────────────────────────────────────────────────────────────

type DailyRow = { date: string; pageViews: number; uniquePageViews: number };
type CountryRow = { country: string; countryCode: string; count: number };
type TimezoneRow = { timezone: string; count: number };
type ReferrerRow = { referrer: string; count: number };
type CampaignRow = { campaign: string; count: number };
type TopPageRow = { pageTitle: string; path: string; count: number };
type TopPubRow = {
	pubTitle: string;
	pubSlug: string | null;
	pubId: string;
	views: number;
	downloads: number;
};
type TopCollectionRow = {
	collectionTitle: string;
	collectionSlug: string | null;
	collectionId: string;
	count: number;
};
type DeviceRow = { device_type: string; count: number };

// ─── timezone → country mapping ──────────────────────────────────────────────

/** Rolls up timezone-level rows into country-level totals using the npm package. */
function rollUpTimezoneToCountries(rows: TimezoneRow[]): CountryRow[] {
	const countryMap = new Map<string, CountryRow>();
	for (const row of rows) {
		const tz = getCountryForTimezone(row.timezone);
		const key = tz ? tz.id : 'Unknown';
		const existing = countryMap.get(key);
		if (existing) {
			existing.count += Number(row.count);
		} else {
			countryMap.set(key, {
				country: tz?.name ?? 'Unknown',
				countryCode: tz?.id ?? '',
				count: Number(row.count),
			});
		}
	}
	return [...countryMap.values()].sort((a, b) => b.count - a.count);
}

// ─── scope filter builder ────────────────────────────────────────────────────

type Scope = {
	communityId: string;
	pubId?: string;
	collectionId?: string;
};

function scopeWhere(
	scope: Scope,
	alias?: string,
): { clause: string; replacements: Record<string, string> } {
	const col = (name: string) => (alias ? `${alias}."${name}"` : `"${name}"`);
	const parts: string[] = [`${col('communityId')} = :communityId`];
	const replacements: Record<string, string> = { communityId: scope.communityId };

	if (scope.pubId) {
		parts.push(`${col('pubId')} = :pubId`);
		replacements.pubId = scope.pubId;
	}
	if (scope.collectionId) {
		parts.push(`${col('collectionId')} = :collectionId`);
		replacements.collectionId = scope.collectionId;
	}

	return { clause: parts.join(' AND '), replacements };
}

// ─── query helper ────────────────────────────────────────────────────────────

async function fetchSummary(scope: Scope, startDate: string, endDate: string) {
	const replacements: Record<string, string> = {
		communityId: scope.communityId,
		startDate,
		endDate,
	};

	const mvDateRange = `date >= :startDate::date AND date <= :endDate::date`;
	const mvCommunity = `"communityId" = :communityId`;
	const mvWhere = `${mvCommunity} AND ${mvDateRange}`;

	// For pub/collection scoping we need the raw table for everything.
	if (scope.pubId || scope.collectionId) {
		return fetchSummaryFromRaw(scope, startDate, endDate);
	}

	const [daily, timezoneRows, topPubs, topPages, topCollections, referrers, campaigns, devices] =
		await Promise.all([
			// ── daily breakdown from matview
			sequelize.query<DailyRow>(
				`SELECT
				date::text,
				page_views AS "pageViews",
				unique_page_views AS "uniquePageViews",
				downloads
			FROM analytics_daily_summary
			WHERE ${mvWhere}
			ORDER BY date`,
				{ replacements, type: QueryTypes.SELECT },
			),
			// ── countries from matview (timezone → country mapped in JS)
			sequelize.query<TimezoneRow>(
				`SELECT
				timezone,
				SUM(count)::int AS count
			FROM analytics_daily_timezone
			WHERE ${mvWhere}
			GROUP BY timezone
			ORDER BY count DESC`,
				{ replacements, type: QueryTypes.SELECT },
			),
			// ── top pubs from matview, JOIN Pubs for titles
			sequelize.query<TopPubRow>(
				`SELECT
				COALESCE(p.title, p.slug, mv."pubId"::text) AS "pubTitle",
				p.slug AS "pubSlug",
				mv."pubId"::text AS "pubId",
				SUM(mv.views)::int AS views,
				SUM(mv.downloads)::int AS downloads
			FROM analytics_daily_pub mv
			LEFT JOIN "Pubs" p ON p.id = mv."pubId"
			WHERE mv."communityId" = :communityId AND mv.date >= :startDate::date AND mv.date <= :endDate::date
			GROUP BY mv."pubId", p.title, p.slug
			ORDER BY (SUM(mv.views) + SUM(mv.downloads)) DESC LIMIT 250`,
				{ replacements, type: QueryTypes.SELECT },
			),
			// ── top pages from matview
			sequelize.query<TopPageRow>(
				`SELECT
				page_title AS "pageTitle",
				path,
				SUM(count)::int AS count
			FROM analytics_daily_page
			WHERE ${mvWhere}
			GROUP BY page_title, path
			ORDER BY count DESC LIMIT 250`,
				{ replacements, type: QueryTypes.SELECT },
			),
			// ── top collections from matview
			sequelize.query<TopCollectionRow>(
				`SELECT
				COALESCE(c.title, mv."collectionId"::text) AS "collectionTitle",
				c.slug AS "collectionSlug",
				mv."collectionId"::text AS "collectionId",
				SUM(mv.count)::int AS count
			FROM analytics_daily_collection mv
			LEFT JOIN "Collections" c ON c.id = mv."collectionId"
			WHERE mv."communityId" = :communityId AND mv.date >= :startDate::date AND mv.date <= :endDate::date
			GROUP BY mv."collectionId", c.title, c.slug
			ORDER BY count DESC LIMIT 250`,
				{ replacements, type: QueryTypes.SELECT },
			),
			// ── referrers from matview
			sequelize.query<ReferrerRow>(
				`SELECT
				referrer,
				SUM(count)::int AS count
			FROM analytics_daily_referrer
			WHERE ${mvWhere}
			GROUP BY referrer
			ORDER BY count DESC LIMIT 250`,
				{ replacements, type: QueryTypes.SELECT },
			),
			// ── campaigns from matview
			sequelize.query<CampaignRow>(
				`SELECT
				campaign,
				SUM(count)::int AS count
			FROM analytics_daily_campaign
			WHERE ${mvWhere}
			GROUP BY campaign
			ORDER BY count DESC LIMIT 250`,
				{ replacements, type: QueryTypes.SELECT },
			),
			// ── devices from matview (Desktop/Mobile/Unknown)
			sequelize.query<DeviceRow>(
				`SELECT
				device_type,
				SUM(count)::int AS count
			FROM analytics_daily_device
			WHERE ${mvWhere}
			GROUP BY device_type
			ORDER BY count DESC LIMIT 250`,
				{ replacements, type: QueryTypes.SELECT },
			),
		]);

	// Derive totals from the daily rows
	let totalPageViews = 0;
	let totalUniqueVisits = 0;
	let totalDownloads = 0;
	const dailyParsed = daily.map((d: any) => {
		const pv = Number(d.pageViews);
		const upv = Number(d.uniquePageViews);
		const dl = Number(d.downloads ?? 0);
		totalPageViews += pv;
		totalUniqueVisits += upv;
		totalDownloads += dl;
		return { date: d.date, pageViews: pv, uniquePageViews: upv };
	});

	return {
		totalPageViews,
		totalUniqueVisits,
		totalDownloads,
		daily: dailyParsed,
		countries: rollUpTimezoneToCountries(timezoneRows).slice(0, 250),
		topPubs: topPubs.map((p) => ({
			...p,
			views: Number(p.views),
			downloads: Number(p.downloads),
		})),
		topPages: topPages.map((p) => ({ ...p, count: Number(p.count) })),
		topCollections: topCollections.map((c) => ({ ...c, count: Number(c.count) })),
		referrers: referrers.map((r) => ({ ...r, count: Number(r.count) })),
		campaigns: campaigns.map((c) => ({ ...c, count: Number(c.count) })),
		devices: devices.map((d) => ({ ...d, count: Number(d.count) })),
	};
}

/**
 * Fallback: query the raw AnalyticsEvents table directly.
 * Used when scoping to a specific pub or collection (dimensions not in every matview).
 */
async function fetchSummaryFromRaw(scope: Scope, startDate: string, endDate: string) {
	const { clause: scopeClause, replacements: scopeReplacements } = scopeWhere(scope);
	const baseReplacements = { ...scopeReplacements, startDate, endDate };

	const dateFilter = `"createdAt" >= :startDate::date AND "createdAt" < (:endDate::date + interval '1 day')`;
	const pageEvents = `event IN ('page','pub','collection','other')`;
	const baseWhere = `${scopeClause} AND ${dateFilter}`;

	const { clause: aeScopeClause } = scopeWhere(scope, 'ae');
	const aeDateFilter = `ae."createdAt" >= :startDate::date AND ae."createdAt" < (:endDate::date + interval '1 day')`;
	const aeBaseWhere = `${aeScopeClause} AND ${aeDateFilter}`;

	// Download events don't carry collectionId — they only have pubId.
	// When scoped to a collection, use a subquery against CollectionPubs
	// to match downloads by the pubs that belong to this collection.
	const dlScopeClause = scope.collectionId
		? `"communityId" = :communityId AND "pubId" IN (SELECT "pubId" FROM "CollectionPubs" WHERE "collectionId" = :collectionId)`
		: scopeClause;
	const dlBaseWhere = `${dlScopeClause} AND ${dateFilter}`;
	const aeDlScopeClause = scope.collectionId
		? `ae."communityId" = :communityId AND ae."pubId" IN (SELECT "pubId" FROM "CollectionPubs" WHERE "collectionId" = :collectionId)`
		: aeScopeClause;
	const aeDlBaseWhere = `${aeDlScopeClause} AND ${aeDateFilter}`;

	const [
		daily,
		[totalDlRow],
		timezoneRows,
		topPubs,
		topPages,
		topCollections,
		referrers,
		campaigns,
		devices,
	] = await Promise.all([
		sequelize.query<DailyRow>(
			`SELECT
				date_trunc('day', "createdAt")::date::text AS date,
				COUNT(*) AS "pageViews",
				COUNT(*) FILTER (WHERE "isUnique" = true) AS "uniquePageViews"
			FROM "AnalyticsEvents"
			WHERE ${baseWhere} AND ${pageEvents}
			GROUP BY 1 ORDER BY 1`,
			{ replacements: baseReplacements, type: QueryTypes.SELECT },
		),
		sequelize.query<{ totalDownloads: string }>(
			`SELECT COUNT(*) AS "totalDownloads"
			FROM "AnalyticsEvents"
			WHERE ${dlBaseWhere} AND event = 'download'`,
			{ replacements: baseReplacements, type: QueryTypes.SELECT },
		),
		sequelize.query<TimezoneRow>(
			`SELECT
				COALESCE(timezone, '') AS timezone,
				COUNT(*) AS count
			FROM "AnalyticsEvents"
			WHERE ${baseWhere} AND ${pageEvents}
			GROUP BY timezone
			ORDER BY count DESC`,
			{ replacements: baseReplacements, type: QueryTypes.SELECT },
		),
		sequelize.query<TopPubRow>(
			`SELECT
				COALESCE(p.title, p.slug, ae."pubId"::text) AS "pubTitle",
				p.slug AS "pubSlug",
				ae."pubId"::text AS "pubId",
				COUNT(*) FILTER (WHERE ae.event = 'pub') AS views,
				COUNT(*) FILTER (WHERE ae.event = 'download') AS downloads
			FROM "AnalyticsEvents" ae
			LEFT JOIN "Pubs" p ON p.id = ae."pubId"
			WHERE ${aeDlBaseWhere} AND ae."pubId" IS NOT NULL AND ae.event IN ('pub','download')
			GROUP BY ae."pubId", p.title, p.slug
			ORDER BY (COUNT(*) FILTER (WHERE ae.event = 'pub') + COUNT(*) FILTER (WHERE ae.event = 'download')) DESC LIMIT 250`,
			{ replacements: baseReplacements, type: QueryTypes.SELECT },
		),
		sequelize.query<TopPageRow>(
			`SELECT
				COALESCE(pg.title, p.title, c.title, ae.path, '') AS "pageTitle",
				COALESCE(ae.path, '') AS path,
				COUNT(*) AS count
			FROM "AnalyticsEvents" ae
			LEFT JOIN "Pages" pg ON pg.id = ae."pageId"
			LEFT JOIN "Pubs" p ON p.id = ae."pubId"
			LEFT JOIN "Collections" c ON c.id = ae."collectionId"
			WHERE ${aeBaseWhere} AND ae.event IN ('page','pub','collection','other')
			GROUP BY pg.title, p.title, c.title, ae.path
			ORDER BY count DESC LIMIT 250`,
			{ replacements: baseReplacements, type: QueryTypes.SELECT },
		),
		sequelize.query<TopCollectionRow>(
			`SELECT
				COALESCE(c.title, ae."collectionId"::text) AS "collectionTitle",
				c.slug AS "collectionSlug",
				ae."collectionId"::text AS "collectionId",
				COUNT(*) AS count
			FROM "AnalyticsEvents" ae
			LEFT JOIN "Collections" c ON c.id = ae."collectionId"
			WHERE ${aeBaseWhere} AND ae."collectionId" IS NOT NULL AND ae.event IN ('collection','pub')
			GROUP BY ae."collectionId", c.title, c.slug
			ORDER BY count DESC LIMIT 250`,
			{ replacements: baseReplacements, type: QueryTypes.SELECT },
		),
		sequelize.query<ReferrerRow>(
			`SELECT
				COALESCE(referrer, 'Direct') AS referrer,
				COUNT(*) AS count
			FROM "AnalyticsEvents"
			WHERE ${baseWhere} AND ${pageEvents}
			GROUP BY referrer
			ORDER BY count DESC LIMIT 250`,
			{ replacements: baseReplacements, type: QueryTypes.SELECT },
		),
		sequelize.query<CampaignRow>(
			`SELECT
				"utmCampaign" AS campaign,
				COUNT(*) AS count
			FROM "AnalyticsEvents"
			WHERE ${baseWhere} AND "utmCampaign" IS NOT NULL AND "utmCampaign" != ''
			GROUP BY "utmCampaign"
			ORDER BY count DESC LIMIT 250`,
			{ replacements: baseReplacements, type: QueryTypes.SELECT },
		),
		sequelize.query<DeviceRow>(
			`SELECT
				CASE
				  WHEN os IN ('iOS','Android') THEN 'Mobile'
				  WHEN os IN ('Windows','MacOS','Linux','UNIX','ChromeOS') THEN 'Desktop'
				  WHEN os = 'Unknown OS' OR os IS NULL OR os = '' THEN 'Unknown'
				  ELSE 'Other'
				END AS device_type,
				COUNT(*)::int AS count
			FROM "AnalyticsEvents"
			WHERE ${baseWhere} AND ${pageEvents}
			GROUP BY device_type
			ORDER BY count DESC LIMIT 250`,
			{ replacements: baseReplacements, type: QueryTypes.SELECT },
		),
	]);

	let totalPageViews = 0;
	let totalUniqueVisits = 0;
	const dailyParsed = daily.map((d) => {
		const pv = Number(d.pageViews);
		const upv = Number(d.uniquePageViews);
		totalPageViews += pv;
		totalUniqueVisits += upv;
		return { ...d, pageViews: pv, uniquePageViews: upv };
	});

	return {
		totalPageViews,
		totalUniqueVisits,
		totalDownloads: parseInt(String((totalDlRow as any)?.totalDownloads ?? '0'), 10),
		daily: dailyParsed,
		countries: rollUpTimezoneToCountries(timezoneRows).slice(0, 250),
		topPubs: topPubs.map((p) => ({
			...p,
			views: Number(p.views),
			downloads: Number(p.downloads),
		})),
		topPages: topPages.map((p) => ({ ...p, count: Number(p.count) })),
		topCollections: topCollections.map((c) => ({ ...c, count: Number(c.count) })),
		referrers: referrers.map((r) => ({ ...r, count: Number(r.count) })),
		campaigns: campaigns.map((c) => ({ ...c, count: Number(c.count) })),
		devices: devices.map((d) => ({ ...d, count: Number(d.count) })),
	};
}

// ─── route ───────────────────────────────────────────────────────────────────

/**
 * GET /api/analytics-impact
 *
 * Returns analytics from the AnalyticsEvents Postgres table for the legacy
 * Impact dashboard.
 *
 * Query params:
 *   startDate    – ISO date (e.g. "2024-01-01"). Defaults to 90 days ago.
 *   endDate      – ISO date. Defaults to today.
 *   pubId        – scope to a specific pub.
 *   collectionId – scope to a specific collection.
 */
router.get('/api/analytics-impact', async (req, res, next) => {
	try {
		if (!hostIsValid(req, 'community')) {
			return next();
		}

		const initialData = await getInitialData(req, { isDashboard: true });
		const { canView } = initialData.scopeData.activePermissions;
		if (!canView) {
			throw new ForbiddenError();
		}

		const communityId = initialData.communityData.id;

		const now = new Date();
		const defaultStart = new Date(now);
		defaultStart.setDate(defaultStart.getDate() - 90);

		let startDate = (req.query.startDate as string) || defaultStart.toISOString().slice(0, 10);
		const endDate = (req.query.endDate as string) || now.toISOString().slice(0, 10);

		// Enforce 2-year maximum range (730 days)
		const MAX_RANGE_DAYS = 730;
		const sDate = new Date(startDate);
		const eDate = new Date(endDate);
		const diffDays = (eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24);
		if (diffDays > MAX_RANGE_DAYS) {
			const clamped = new Date(eDate);
			clamped.setDate(clamped.getDate() - MAX_RANGE_DAYS);
			startDate = clamped.toISOString().slice(0, 10);
		}

		const pubId = req.query.pubId as string | undefined;
		const collectionId = req.query.collectionId as string | undefined;

		const scope: Scope = { communityId };
		if (pubId) scope.pubId = pubId;
		if (collectionId) scope.collectionId = collectionId;

		const key = cacheKey(scope, startDate, endDate);
		const cached = getCached(key);
		if (cached) {
			return res.json(cached);
		}

		const result = await fetchSummary(scope, startDate, endDate);
		setCache(key, result);
		return res.json(result);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
