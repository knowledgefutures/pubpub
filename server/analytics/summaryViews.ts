/**
 * Materialized views that pre-aggregate AnalyticsEvents by day.
 *
 * Each view collapses millions of raw rows into a handful of daily summary rows
 * so dashboard queries scan orders of magnitude less data.
 *
 * Call `createSummaryViews()` once (idempotent) and `refreshSummaryViews()`
 * periodically (e.g. nightly cron or after new data is imported).
 */
import { sequelize } from 'server/sequelize';

// ─── Individual CREATE statements ────────────────────────────────────────────
// Each view has its own CREATE + UNIQUE INDEX so failures are isolated.
// For views with potentially large text keys (referrer, campaign, page_title,
// path), we use md5() hashes in the unique index to stay within btree limits.

const VIEWS: Array<{ name: string; createSql: string; indexSql: string }> = [
	{
		name: 'analytics_daily_summary',
		createSql: `
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_daily_summary AS
SELECT
    "communityId",
    date_trunc('day', "createdAt")::date AS date,
    COUNT(*) FILTER (WHERE event IN ('page','pub','collection','other')) AS page_views,
    COUNT(*) FILTER (WHERE event IN ('page','pub','collection','other') AND "isUnique" = true) AS unique_page_views,
    COUNT(*) FILTER (WHERE event = 'download') AS downloads
FROM "AnalyticsEvents"
GROUP BY "communityId", date_trunc('day', "createdAt")::date`,
		indexSql: `
CREATE UNIQUE INDEX IF NOT EXISTS analytics_daily_summary_uk
    ON analytics_daily_summary ("communityId", date)`,
	},
	{
		name: 'analytics_daily_timezone',
		createSql: `
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_daily_timezone AS
SELECT
    "communityId",
    date_trunc('day', "createdAt")::date AS date,
    COALESCE(timezone, '') AS timezone,
    COUNT(*) AS count
FROM "AnalyticsEvents"
WHERE event IN ('page','pub','collection','other')
GROUP BY "communityId", date_trunc('day', "createdAt")::date, timezone`,
		indexSql: `
CREATE UNIQUE INDEX IF NOT EXISTS analytics_daily_timezone_uk
    ON analytics_daily_timezone ("communityId", date, md5(timezone))`,
	},
	{
		name: 'analytics_daily_pub',
		createSql: `
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_daily_pub AS
SELECT
    "communityId",
    "pubId",
    date_trunc('day', "createdAt")::date AS date,
    COUNT(*) FILTER (WHERE event = 'pub') AS views,
    COUNT(*) FILTER (WHERE event = 'download') AS downloads
FROM "AnalyticsEvents"
WHERE "pubId" IS NOT NULL AND event IN ('pub','download')
GROUP BY "communityId", "pubId", date_trunc('day', "createdAt")::date`,
		indexSql: `
CREATE UNIQUE INDEX IF NOT EXISTS analytics_daily_pub_uk
    ON analytics_daily_pub ("communityId", "pubId", date)`,
	},
	{
		name: 'analytics_daily_collection',
		createSql: `
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_daily_collection AS
SELECT
    "communityId",
    "collectionId",
    date_trunc('day', "createdAt")::date AS date,
    COUNT(*) AS count
FROM "AnalyticsEvents"
WHERE "collectionId" IS NOT NULL AND event IN ('collection','pub')
GROUP BY "communityId", "collectionId", date_trunc('day', "createdAt")::date`,
		indexSql: `
CREATE UNIQUE INDEX IF NOT EXISTS analytics_daily_collection_uk
    ON analytics_daily_collection ("communityId", "collectionId", date)`,
	},
	// NOTE: referrer and page matviews have high cardinality per community×day,
	// but still dramatically outperform the raw table for year-long date ranges
	// (raw table seq-scans ~19M rows; matviews only scan the pre-grouped rows).
	// The unique index uses md5() to stay within btree's 2704-byte limit.
	{
		name: 'analytics_daily_referrer',
		createSql: `
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_daily_referrer AS
SELECT
    "communityId",
    date_trunc('day', "createdAt")::date AS date,
    COALESCE(LEFT(referrer, 500), 'Direct') AS referrer,
    COUNT(*) AS count
FROM "AnalyticsEvents"
WHERE event IN ('page','pub','collection','other')
GROUP BY "communityId", date_trunc('day', "createdAt")::date, COALESCE(LEFT(referrer, 500), 'Direct')`,
		indexSql: `
CREATE UNIQUE INDEX IF NOT EXISTS analytics_daily_referrer_uk
    ON analytics_daily_referrer ("communityId", date, md5(referrer))`,
	},
	{
		name: 'analytics_daily_campaign',
		createSql: `
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_daily_campaign AS
SELECT
    "communityId",
    date_trunc('day', "createdAt")::date AS date,
    "utmCampaign" AS campaign,
    COUNT(*) AS count
FROM "AnalyticsEvents"
WHERE "utmCampaign" IS NOT NULL AND "utmCampaign" != ''
GROUP BY "communityId", date_trunc('day', "createdAt")::date, "utmCampaign"`,
		indexSql: `
CREATE UNIQUE INDEX IF NOT EXISTS analytics_daily_campaign_uk
    ON analytics_daily_campaign ("communityId", date, md5(campaign))`,
	},
	{
		name: 'analytics_daily_page',
		createSql: `
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_daily_page AS
SELECT
    ae."communityId",
    date_trunc('day', ae."createdAt")::date AS date,
    LEFT(COALESCE(pg.title, p.title, c.title, ae.path, ''), 300) AS page_title,
    LEFT(COALESCE(ae.path, ''), 300) AS path,
    COUNT(*) AS count
FROM "AnalyticsEvents" ae
LEFT JOIN "Pages" pg ON pg.id = ae."pageId"
LEFT JOIN "Pubs" p ON p.id = ae."pubId"
LEFT JOIN "Collections" c ON c.id = ae."collectionId"
WHERE ae.event IN ('page','pub','collection','other')
GROUP BY ae."communityId", date_trunc('day', ae."createdAt")::date,
    LEFT(COALESCE(pg.title, p.title, c.title, ae.path, ''), 300),
    LEFT(COALESCE(ae.path, ''), 300)`,
		indexSql: `
CREATE UNIQUE INDEX IF NOT EXISTS analytics_daily_page_uk
    ON analytics_daily_page ("communityId", date, md5(page_title || '|' || path))`,
	},
	{
		name: 'analytics_daily_device',
		createSql: `
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_daily_device AS
SELECT
    "communityId",
    date_trunc('day', "createdAt")::date AS date,
    CASE
      WHEN os IN ('iOS','Android') THEN 'Mobile'
      WHEN os IN ('Windows','MacOS','Linux','UNIX','ChromeOS') THEN 'Desktop'
      WHEN os = 'Unknown OS' OR os IS NULL OR os = '' THEN 'Unknown'
      ELSE 'Other'
    END AS device_type,
    COUNT(*) AS count
FROM "AnalyticsEvents"
WHERE event IN ('page','pub','collection','other')
GROUP BY "communityId", date_trunc('day', "createdAt")::date,
    CASE
      WHEN os IN ('iOS','Android') THEN 'Mobile'
      WHEN os IN ('Windows','MacOS','Linux','UNIX','ChromeOS') THEN 'Desktop'
      WHEN os = 'Unknown OS' OR os IS NULL OR os = '' THEN 'Unknown'
      ELSE 'Other'
    END`,
		indexSql: `
CREATE UNIQUE INDEX IF NOT EXISTS analytics_daily_device_uk
    ON analytics_daily_device ("communityId", date, device_type)`,
	},
];

// ─── public API ──────────────────────────────────────────────────────────────

export async function createSummaryViews() {
	// Execute each view creation + index separately so that already-existing
	// views don't block subsequent ones.
	await VIEWS.reduce(
		(chain, v) =>
			chain.then(async () => {
				await sequelize.query(v.createSql);
				await sequelize.query(v.indexSql);
			}),
		Promise.resolve() as Promise<unknown>,
	);
	// Plain B-tree indexes on (communityId, date) for views whose unique index
	// uses md5() – the plain index lets PG do a simple range scan without the
	// overhead of the functional index.
	await sequelize.query(`
		CREATE INDEX IF NOT EXISTS analytics_daily_referrer_comm_date
		    ON analytics_daily_referrer ("communityId", date)`);
	await sequelize.query(`
		CREATE INDEX IF NOT EXISTS analytics_daily_page_comm_date
		    ON analytics_daily_page ("communityId", date)`);
	await sequelize.query(`
		CREATE INDEX IF NOT EXISTS analytics_daily_timezone_comm_date
		    ON analytics_daily_timezone ("communityId", date)`);
}

/**
 * Refresh all summary materialized views.
 * Uses CONCURRENTLY for views with plain unique indexes, and non-concurrent
 * for views whose unique index uses function expressions (md5).
 * After refresh, CLUSTERs each view so that rows for the same communityId+date
 * are physically contiguous on disk, dramatically reducing random I/O.
 */
// Map view name → preferred CLUSTER index. For views with md5-based unique
// indexes, we cluster by the plain (communityId, date) index instead for
// better physical data locality.
const CLUSTER_INDEX: Record<string, string> = {
	analytics_daily_referrer: 'analytics_daily_referrer_comm_date',
	analytics_daily_page: 'analytics_daily_page_comm_date',
	analytics_daily_timezone: 'analytics_daily_timezone_comm_date',
};

export async function refreshSummaryViews() {
	await VIEWS.reduce(
		(chain, v) => {
			const concurrent = v.indexSql.includes('md5(') ? '' : ' CONCURRENTLY';
			const defaultIdx = v.indexSql.match(/INDEX IF NOT EXISTS (\S+)/)?.[1] ?? '';
			const clusterIdx = CLUSTER_INDEX[v.name] ?? defaultIdx;
			return chain.then(async () => {
				await sequelize.query(`REFRESH MATERIALIZED VIEW${concurrent} ${v.name}`);
				if (clusterIdx) {
					await sequelize.query(`CLUSTER ${v.name} USING ${clusterIdx}`);
					await sequelize.query(`ANALYZE ${v.name}`);
				}
			});
		},
		Promise.resolve() as Promise<unknown>,
	);
}
