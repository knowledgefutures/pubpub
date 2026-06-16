/**
 * One-time migration: Redshift CSV backup (S3) → local Postgres AnalyticsEvents.
 *
 * This was run in production on 2026-04-15 to import ~19M rows of historical
 * analytics data from the old Stitch/Redshift pipeline into the new local PG
 * table. It is kept here for historical reference and in case a similar
 * migration is ever needed again.
 *
 * Usage:
 *   pnpm run tools migrateRedshift
 *
 * Required env vars (set in .env or export manually):
 *   AM_REDSHIFT_BACKUP_ACCESS_KEY – AWS IAM key for the S3 bucket
 *   AM_REDSHIFT_BACKUP_SECRET_KEY – AWS IAM secret
 *   AM_REDSHIFT_PATH              – S3 path, e.g. s3://my-bucket/redshift-backup/
 *   DATABASE_URL                   – Postgres connection string (auto-set by tools runner)
 *
 * Optional:
 *   FORCE_DOWNLOAD=1 – re-download even if local copies exist
 *   DATA_DIR         – override the local directory for CSV files
 *                      (default: ./tmp/redshift-data)
 *
 * The script is fully idempotent:
 *   - CREATE TABLE/INDEX IF NOT EXISTS
 *   - INSERT ... ON CONFLICT (id) DO NOTHING
 *   - Skips Redshift rows newer than the earliest PG row (cutoff logic)
 *   - Skips S3 download if files already exist locally
 */

import type { Readable } from 'stream';

import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { execSync } from 'child_process';
import { createWriteStream, mkdirSync } from 'fs';
import { readdir } from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';

import { sequelize } from 'server/sequelize';

// ─── helpers ─────────────────────────────────────────────────────────────────

/* eslint-disable no-await-in-loop */

const log = (msg: string) => console.info(`[migrateRedshift] ${msg}`);

/** Run async fn sequentially over items (avoids biome noAwaitInLoops). */
async function sequential<T>(items: T[], fn: (item: T) => Promise<void>): Promise<void> {
	if (items.length === 0) return;
	const [head, ...tail] = items;
	return fn(head).then(() => sequential(tail, fn));
}

function required(name: string): string {
	const val = process.env[name];
	if (!val) throw new Error(`Missing required env var: ${name}`);
	return val;
}

function parseS3Path(s3Path: string): { bucket: string; prefix: string } {
	const match = s3Path.match(/^s3:\/\/([^/]+)\/?(.*)$/);
	if (!match) throw new Error(`Invalid S3 path: ${s3Path}`);
	return { bucket: match[1], prefix: match[2].replace(/\/$/, '') };
}

// ─── S3 download ─────────────────────────────────────────────────────────────

async function downloadFromS3(dataDir: string, force: boolean) {
	const accessKeyId = required('AM_REDSHIFT_BACKUP_ACCESS_KEY');
	const secretAccessKey = required('AM_REDSHIFT_BACKUP_SECRET_KEY');
	const s3Path = required('AM_REDSHIFT_PATH');
	const { bucket, prefix } = parseS3Path(s3Path);

	const s3 = new S3Client({
		region: 'us-east-1',
		credentials: { accessKeyId, secretAccessKey },
	});

	mkdirSync(dataDir, { recursive: true });

	// Check if we already have files
	if (!force) {
		const existing = (await readdir(dataDir)).filter((f) => f.startsWith('data'));
		if (existing.length > 0) {
			log(
				`[1/5] backup already present (${existing.length} files), skipping (set FORCE_DOWNLOAD=1 to re-download)`,
			);
			return;
		}
	}

	log('[1/5] downloading redshift backup from S3...');

	const listRes = await s3.send(
		new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix ? `${prefix}/` : undefined }),
	);
	const objects = listRes.Contents ?? [];
	if (objects.length === 0) {
		throw new Error(`No objects found at s3://${bucket}/${prefix}/`);
	}

	const downloadable = objects.filter((obj) => !!obj.Key);
	await sequential(downloadable, async (obj) => {
		const filename = path.basename(obj.Key!);
		const localPath = path.join(dataDir, filename);

		log(`  downloading ${filename}...`);
		const getRes = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: obj.Key }));
		if (!getRes.Body) return;

		await pipeline(getRes.Body as Readable, createWriteStream(localPath));
	});
	log(`  downloaded ${objects.length} files`);
}

// ─── SQL statements ──────────────────────────────────────────────────────────

const ENSURE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS "AnalyticsEvents" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL,
    event text NOT NULL,
    "createdAt" timestamptz NOT NULL DEFAULT now(),
    referrer text,
    "isUnique" boolean,
    search text,
    "utmSource" text,
    "utmMedium" text,
    "utmCampaign" text,
    "utmTerm" text,
    "utmContent" text,
    timezone text NOT NULL,
    locale text NOT NULL,
    "userAgent" text NOT NULL,
    os text NOT NULL,
    "communityId" uuid,
    url text,
    hash text,
    height integer,
    width integer,
    path text,
    "pageId" uuid,
    "collectionId" uuid,
    "pubId" uuid,
    release text,
    format text
);

CREATE INDEX IF NOT EXISTS "analytics_events_community_event_created"
    ON "AnalyticsEvents" ("communityId", event, "createdAt");
CREATE INDEX IF NOT EXISTS "analytics_events_pub_event_created"
    ON "AnalyticsEvents" ("pubId", event, "createdAt");
CREATE INDEX IF NOT EXISTS "analytics_events_collection_event_created"
    ON "AnalyticsEvents" ("collectionId", event, "createdAt");

-- Optimized index for dashboard queries: all filter by communityId + time range
CREATE INDEX IF NOT EXISTS "analytics_events_community_created"
    ON "AnalyticsEvents" ("communityId", "createdAt");

-- Partial covering index for the common page-view aggregations
CREATE INDEX IF NOT EXISTS "analytics_events_community_pages"
    ON "AnalyticsEvents" ("communityId", "createdAt", "isUnique")
    WHERE event IN ('page','pub','collection','other');

-- Partial index for pub-scoped views + downloads
CREATE INDEX IF NOT EXISTS "analytics_events_pub_views_dl"
    ON "AnalyticsEvents" ("communityId", "pubId", "createdAt")
    WHERE "pubId" IS NOT NULL AND event IN ('pub','download');
`;

const CREATE_STAGING_SQL = `
DROP TABLE IF EXISTS analytics_staging;
CREATE UNLOGGED TABLE analytics_staging (
    __sdc_primary_key text,
    _sdc_batched_at text,
    _sdc_received_at text,
    _sdc_sequence text,
    _sdc_table_version text,
    collectionid text,
    collectionkind text,
    communityid text,
    country text,
    countrycode text,
    event text,
    height text,
    isprod text,
    primarycollectionid text,
    pubid text,
    type text,
    "unique" text,
    width text,
    "timestamp" text,
    utmcontent text,
    utmmedium text,
    utmterm text,
    release__string text,
    path text,
    collectiontitle text,
    collectionslug text,
    pubslug text,
    communityname text,
    collectionids text,
    release__bigint text,
    pagetitle text,
    referrer text,
    utmcampaign text,
    utmsource text,
    timezone text,
    os text,
    pageid text,
    locale text,
    pageslug text,
    communitysubdomain text,
    format text,
    useragent text,
    pubtitle text,
    url text,
    search text,
    title text,
    hash text
);
`;

/**
 * Build the TRANSFORM SQL with an optional cutoff timestamp.
 * If cutoffTs is provided, Redshift rows with a timestamp >= cutoffTs are skipped
 * to avoid importing duplicates of events already written directly to PG.
 */
function buildTransformSql(cutoffTs: string | null): string {
	const cutoffClause = cutoffTs
		? `\n  AND pg_temp.safe_ts(s."timestamp") < '${cutoffTs}'::timestamptz`
		: '';

	return `
CREATE OR REPLACE FUNCTION pg_temp.safe_uuid(val text) RETURNS uuid AS $$
SELECT CASE
    WHEN val ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'
    THEN val::uuid
    ELSE NULL
END;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION pg_temp.safe_ts(val text) RETURNS timestamptz AS $$
SELECT CASE
    WHEN val IS NULL OR val = '' THEN NULL
    WHEN val::double precision BETWEEN 1e12 AND 2e13
    THEN to_timestamp(val::double precision / 1000.0)
    ELSE NULL
END;
$$ LANGUAGE sql IMMUTABLE;

-- Helper: returns true when ANY of the given text fields look like injection/spam
CREATE OR REPLACE FUNCTION pg_temp.is_spam(VARIADIC vals text[]) RETURNS boolean AS $$
SELECT EXISTS (
    SELECT 1 FROM unnest(vals) v
    WHERE v ~* '(<script|union\\s+select|drop\\s+table|insert\\s+into|delete\\s+from|xp_cmdshell|0x[0-9A-Fa-f]{20,})'
);
$$ LANGUAGE sql IMMUTABLE;

-- Helper: validates an IANA-style timezone string (e.g. "America/New_York", "UTC")
-- Rejects clear nonsense while being lenient on edge-case zones.
CREATE OR REPLACE FUNCTION pg_temp.safe_tz(val text) RETURNS text AS $$
SELECT CASE
    WHEN val IS NULL OR val = '' THEN 'UTC'
    WHEN val ~ '^[A-Za-z_/+-][A-Za-z0-9_/+-]{1,50}$' THEN val
    ELSE 'UTC'
END;
$$ LANGUAGE sql IMMUTABLE;

INSERT INTO "AnalyticsEvents" (
    id, type, event, "createdAt",
    referrer, "isUnique", search,
    "utmSource", "utmMedium", "utmCampaign", "utmTerm", "utmContent",
    timezone, locale, "userAgent", os,
    "communityId",
    url, hash, height, width, path,
    "pageId", "collectionId", "pubId",
    release, format
)
SELECT
    COALESCE(pg_temp.safe_uuid(s.__sdc_primary_key), gen_random_uuid()),
    s.type,
    s.event,
    pg_temp.safe_ts(s."timestamp"),

    NULLIF(s.referrer, ''),
    CASE WHEN s."unique" = 't' THEN true
         WHEN s."unique" = 'f' THEN false
         ELSE NULL END,
    NULLIF(s.search, ''),

    NULLIF(s.utmsource, ''),
    NULLIF(s.utmmedium, ''),
    NULLIF(s.utmcampaign, ''),
    NULLIF(s.utmterm, ''),
    NULLIF(s.utmcontent, ''),

    pg_temp.safe_tz(s.timezone),
    COALESCE(NULLIF(s.locale, ''), 'en-US'),
    COALESCE(NULLIF(s.useragent, ''), 'unknown'),
    COALESCE(NULLIF(s.os, ''), 'unknown'),

    pg_temp.safe_uuid(s.communityid),

    NULLIF(s.url, ''),
    NULLIF(s.hash, ''),
    CASE WHEN s.height ~ '^\\d{1,9}$' THEN s.height::int ELSE NULL END,
    CASE WHEN s.width ~ '^\\d{1,9}$' THEN s.width::int ELSE NULL END,
    NULLIF(s.path, ''),

    pg_temp.safe_uuid(s.pageid),
    pg_temp.safe_uuid(s.collectionid),
    pg_temp.safe_uuid(s.pubid),

    COALESCE(NULLIF(s.release__string, ''), NULLIF(s.release__bigint, '')),
    NULLIF(s.format, '')

FROM analytics_staging s
WHERE s.type IS NOT NULL
  AND s.event IS NOT NULL
  AND pg_temp.safe_ts(s."timestamp") IS NOT NULL
  -- Only import rows flagged as production
  AND s.isprod = 't'
  -- ── Data cleaning: skip spam/injection rows ──
  AND NOT pg_temp.is_spam(
      s.referrer, s.url, s.title, s.search, s.path,
      s.utmsource, s.utmmedium, s.utmcampaign, s.utmterm, s.utmcontent,
      s.pubtitle, s.communityname
  )
  -- Skip rows with clearly bogus timestamps (before 2016 or in the future)
  AND pg_temp.safe_ts(s."timestamp") >= '2016-01-01'::timestamptz
  AND pg_temp.safe_ts(s."timestamp") <= (now() + interval '1 day')${cutoffClause}
ON CONFLICT (id) DO NOTHING;
`;
}

// ─── main ────────────────────────────────────────────────────────────────────

/** Post-import cleanup: delete spam rows that may have slipped in from earlier runs. */
const CLEANUP_SPAM_SQL = `
DELETE FROM "AnalyticsEvents"
WHERE referrer ~* '(<script|union\\s+select|drop\\s+table|insert\\s+into|delete\\s+from|xp_cmdshell|0x[0-9A-Fa-f]{20,})'
   OR url     ~* '(<script|union\\s+select|drop\\s+table|insert\\s+into|delete\\s+from|xp_cmdshell|0x[0-9A-Fa-f]{20,})'
   OR search  ~* '(<script|union\\s+select|drop\\s+table|insert\\s+into|delete\\s+from|xp_cmdshell|0x[0-9A-Fa-f]{20,})'
   OR "createdAt" < '2016-01-01'::timestamptz
   OR "createdAt" > (now() + interval '1 day');
`;

async function main() {
	// Default data dir is inside the repo so it persists across container runs
	// (the app service bind-mounts the repo at /app).
	const dataDir = process.env.DATA_DIR ?? path.join(__dirname, '../tmp/redshift-data');
	const force = process.env.FORCE_DOWNLOAD === '1';

	log('redshift migration');
	log(`  data dir: ${dataDir}`);

	// Step 1: download
	await downloadFromS3(dataDir, force);

	// Step 2: ensure table
	log('[2/5] ensuring AnalyticsEvents table...');
	await sequelize.query(ENSURE_TABLE_SQL);

	const [countResult] = await sequelize.query<{ count: string }>(
		'SELECT count(*) as count FROM "AnalyticsEvents"',
		{ type: 'SELECT' as any },
	);
	const existingCount = parseInt((countResult as any).count, 10);
	if (existingCount > 0) {
		log(`  table already has ${existingCount} rows, duplicates will be skipped`);
	}

	// Determine cutoff: if the PG table already has rows (from direct writes),
	// skip any Redshift data with a timestamp >= the earliest PG row to avoid
	// importing duplicates of events that were dual-written.
	let cutoffTs: string | null = null;
	if (existingCount > 0) {
		const [minRow] = await sequelize.query<{ min_ts: string }>(
			'SELECT MIN("createdAt")::text AS min_ts FROM "AnalyticsEvents"',
			{ type: 'SELECT' as any },
		);
		cutoffTs = (minRow as any)?.min_ts ?? null;
		if (cutoffTs) {
			log(`  cutoff: skipping Redshift rows with timestamp >= ${cutoffTs}`);
		}
	}

	const transformSql = buildTransformSql(cutoffTs);

	// Steps 3-5: process each CSV file one at a time to keep peak disk usage
	// low. For each file: create staging → COPY in → transform to final table
	// → drop staging. This avoids needing disk space for ALL rows in staging
	// AND the final table simultaneously.
	const files = (await readdir(dataDir)).filter((f) => /^data\d{3}$/.test(f)).sort();

	if (files.length === 0) {
		throw new Error(`No data files found in ${dataDir}`);
	}

	log(`[3/7] processing ${files.length} CSV files...`);
	let fileIdx = 0;
	await sequential(files, async (file) => {
		fileIdx++;
		const filePath = path.join(dataDir, file);
		log(`  [${fileIdx}/${files.length}] ${file}: staging...`);

		// Create fresh staging table for this file
		await sequelize.query(CREATE_STAGING_SQL);

		// Stream CSV into staging via psql \copy (client-side COPY FROM STDIN)
		const dbUrl = process.env.DATABASE_URL!;
		execSync(`psql "${dbUrl}" -c "\\copy analytics_staging FROM '${filePath}' CSV HEADER"`, {
			stdio: 'inherit',
		});

		const [stagingCount] = await sequelize.query<{ count: string }>(
			'SELECT count(*) as count FROM analytics_staging',
			{ type: 'SELECT' as any },
		);
		log(
			`  [${fileIdx}/${files.length}] ${file}: staged ${(stagingCount as any).count} rows, transforming...`,
		);

		// Transform and insert into final table
		await sequelize.query(transformSql);

		// Drop staging to free disk space before next file
		await sequelize.query('DROP TABLE IF EXISTS analytics_staging');
		log(`  [${fileIdx}/${files.length}] ${file}: done`);
	});

	log('[4/7] cleaning spam rows from existing data...');
	const [, { rowCount: spamDeleted }] = (await sequelize.query(CLEANUP_SPAM_SQL)) as any;
	log(`  removed ${spamDeleted ?? 0} spam/invalid rows`);

	log('[5/7] running ANALYZE...');
	await sequelize.query('ANALYZE "AnalyticsEvents"');

	const [finalCount] = await sequelize.query<{ count: string }>(
		'SELECT count(*) as count FROM "AnalyticsEvents"',
		{ type: 'SELECT' as any },
	);
	log(`[6/7] ${(finalCount as any).count} rows in AnalyticsEvents.`);

	log('[7/7] creating & refreshing summary materialized views...');
	const { createSummaryViews, refreshSummaryViews } = await import(
		'server/analytics/summaryViews.js'
	);
	await createSummaryViews();
	await refreshSummaryViews();
	log('done.');
}

main()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error('[migrateRedshift] FATAL:', err);
		process.exit(1);
	});
