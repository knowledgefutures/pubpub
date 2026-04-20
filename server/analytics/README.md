# Analytics (Legacy Impact Dashboard)

The Impact dashboard (`/dash/impact`) displays page views, unique
visits, downloads, top pubs, countries, referrers, campaigns, and pages for a
community. It replaces the old Metabase-iframe approach with native Recharts
graphs served directly from Postgres.

> **Impact2** (`/dash/impact2`) is an entirely separate system backed by
> Cloudflare analytics and is unaffected by any of this.

---

## Data Flow

```
                      ┌─────────────────────────────────┐
                      │  Browser (every page view)      │
                      │  navigator.sendBeacon(payload)  │
                      └──────────────┬──────────────────┘
                                     │ POST /api/ev
                                     ▼
                          ┌──────────────────────┐
                          │  Write Buffer        │  in-memory, flushes every
                          │  (writeBuffer.ts)    │  5s or 500 events
                          └──────────┬───────────┘
                                     │ bulkCreate
                                     ▼
  ┌─────────────────────────────────────────────┐
  │  AnalyticsEvents                            │  ~19M rows (raw table)
  │  (server/analytics/model.ts)                │
  └────────────────────┬────────────────────────┘
                       │
                       │  REFRESH + CLUSTER + ANALYZE
                       │  (nightly cron → tools/refreshAnalyticsSummary.ts)
                       ▼
  ┌─────────────────────────────────────────────────────┐
  │  7 Materialized Views (pre-aggregated by day)       │
  │                                                     │
  │  analytics_daily_summary      (44 MB)               │
  │  analytics_daily_timezone     (233 MB)              │
  │  analytics_daily_pub          (593 MB)              │
  │  analytics_daily_collection   (99 MB)               │
  │  analytics_daily_referrer     (589 MB)              │
  │  analytics_daily_campaign     (1 MB)                │
  │  analytics_daily_page         (1.4 GB)              │
  └────────────────────┬────────────────────────────────┘
                       │
                       ▼
  ┌─────────────────────┐       ┌──────────────────────┐
  │  GET /api/analytics │──────▶│  DashboardImpact.tsx │
  │  -impact            │  JSON │  (Recharts)          │
  │  (impactApi.ts)     │       └──────────────────────┘
  └─────────────────────┘
```

---

## Write Path (Ingestion)

Every page view sends a `navigator.sendBeacon` POST to `/api/ev`.
Instead of issuing one INSERT per request, events are queued in an **in-memory
write buffer** (`server/analytics/writeBuffer.ts`) and flushed to Postgres in
batches:

- **Flush interval:** every 5 seconds
- **Flush cap:** immediately if buffer reaches 500 events
- **Graceful shutdown:** SIGTERM / SIGINT flushes remaining events before exit
- **Failure handling:** failed batches are retried on the next tick; dropped
  only if the buffer exceeds 2× the cap (PG truly down)

This reduces per-request DB overhead (index maintenance, WAL writes, connection
churn) from N round-trips to 1. The tradeoff: up to 5 seconds of events can be
lost on an ungraceful crash (OOM, SIGKILL). This is acceptable for analytics.

---

## Lifecycle

### Server Startup

On `sequelize.sync()` completion (in `server/sequelize.ts`), the server calls
`createSummaryViews()`. This is **idempotent** — it uses
`CREATE MATERIALIZED VIEW IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`, so
it's a no-op on subsequent boots. It does **not** refresh data, so startup stays
fast.

The write buffer starts automatically when `writeBuffer.ts` is first imported
(via `api.ts`).

### Nightly Cron

`tools/cron.ts` schedules a refresh at **3:30 AM UTC daily**:

```
pnpm run tools-prod refreshAnalyticsSummary refresh
```

This runs `refreshSummaryViews()` which, for each of the 7 views:

1. `REFRESH MATERIALIZED VIEW [CONCURRENTLY] <view>`
2. `CLUSTER <view> USING <index>` — physically reorders rows by
   `(communityId, date)` so range scans read contiguous disk pages
3. `ANALYZE <view>` — updates planner statistics

Total refresh time is typically 3–5 minutes depending on data volume.

### Manual Refresh

```sh
# Create views if missing + refresh all:
pnpm run tools refreshAnalyticsSummary

# Refresh only (views must already exist):
pnpm run tools refreshAnalyticsSummary refresh
```

---

## Performance Optimizations

### Problem

The raw `AnalyticsEvents` table has ~19M rows. A year-long dashboard query for
the largest community took 26+ seconds scanning millions of rows.

### Solution: Layered Approach

| Layer | Technique | Impact |
|-------|-----------|--------|
| **1. Materialized Views** | Pre-aggregate by day — 7 views that collapse millions of rows into thousands | 26s → 3.7s |
| **2. CLUSTER** | Physically reorder matview rows by `(communityId, date)` so range scans read contiguous disk pages instead of random I/O | 3.7s → 730ms |
| **3. Plain B-tree Indexes** | Add non-functional `(communityId, date)` indexes on views whose unique index uses `md5()` (referrer, page) — lets PG do a simple index range scan | 730ms → ~400ms sequential, **~260ms wall-clock** with `Promise.all` |
| **4. In-Memory Cache** | 5-minute TTL, max 500 entries — subsequent requests within the window are instant | 260ms → 0ms (cache hit) |

### Why md5() Unique Indexes?

The `referrer` and `page_title` columns can be very long (URLs). PostgreSQL's
btree index entries have a hard 2704-byte limit. We use `md5()` in the unique
index to stay within that limit, but md5-based indexes are less efficient for
range scans. That's why those two views get an **additional** plain
`(communityId, date)` index that PG uses for the actual `WHERE` filter.

### CLUSTER vs. No CLUSTER

Without CLUSTER, PG stores matview rows in insertion order (which follows the
raw table's order — effectively random with respect to communityId). A query
for one community's year of data might touch 38K scattered heap blocks. After
CLUSTER, the same query touches ~1,800 contiguous blocks — an **8.7× speedup**
for the largest view.

CLUSTER is re-applied on every refresh because `REFRESH MATERIALIZED VIEW`
rewrites the entire view.

---

## Indexes on the Raw Table

The Sequelize model (`server/analytics/model.ts`) defines 6 indexes that are
managed by `sequelize.sync()`:

| Index | Fields | Partial WHERE |
|-------|--------|---------------|
| `analytics_events_community_event_ts` | `communityId, event, timestamp` | — |
| `analytics_events_pub_event_ts` | `pubId, event, timestamp` | — |
| `analytics_events_collection_event_ts` | `collectionId, event, timestamp` | — |
| `analytics_events_community_ts` | `communityId, timestamp` | — |
| `analytics_events_community_pages` | `communityId, timestamp, isUnique` | `event IN ('page','pub','collection','other')` |
| `analytics_events_pub_views_dl` | `communityId, pubId, timestamp` | `pubId IS NOT NULL AND event IN ('pub','download')` |

These are used by the **raw-table fallback** path (`fetchSummaryFromRaw`) which
runs when a query is scoped to a specific pub or collection (dimensions that
don't exist across all matviews).

---

## API

### `GET /api/analytics-impact`

**Auth:** Requires community dashboard view permission.

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `startDate` | ISO date string | 90 days ago | Start of range |
| `endDate` | ISO date string | today | End of range |
| `pubId` | UUID | — | Scope to a specific pub (uses raw table) |
| `collectionId` | UUID | — | Scope to a specific collection (uses raw table) |

**Response shape:**

```json
{
  "totalPageViews": 123456,
  "totalUniqueVisits": 78901,
  "totalDownloads": 4567,
  "daily": [{ "date": "2025-01-01", "pageViews": 100, "uniquePageViews": 60 }],
  "countries": [{ "country": "United States", "countryCode": "US", "count": 5000 }],
  "topPubs": [{ "pubTitle": "...", "pubId": "...", "views": 100, "downloads": 5 }],
  "topPages": [{ "pageTitle": "...", "path": "/...", "count": 100 }],
  "topCollections": [{ "collectionTitle": "...", "collectionId": "...", "count": 100 }],
  "referrers": [{ "referrer": "https://google.com", "count": 100 }],
  "campaigns": [{ "campaign": "spring-2025", "count": 50 }]
}
```

**Query routing:**
- Community-level (no pubId/collectionId) → reads from materialized views
- Pub/collection-scoped → falls back to raw `AnalyticsEvents` table

---

## File Map

| File | Purpose |
|------|---------|
| `server/analytics/api.ts` | HTTP handler for `POST /api/ev` |
| `server/analytics/writeBuffer.ts` | Batched write buffer (enqueue → bulkCreate) |
| `server/analytics/model.ts` | Sequelize model + raw table indexes |
| `server/analytics/summaryViews.ts` | Matview DDL, create/refresh functions |
| `server/analytics/impactApi.ts` | Dashboard read API + query logic + cache |
| `server/sequelize.ts` | Calls `createSummaryViews()` on startup |
| `tools/refreshAnalyticsSummary.ts` | CLI tool for manual/cron refresh |
| `tools/cron.ts` | Nightly refresh schedule (3:30 AM UTC) |
| `client/containers/DashboardImpact/` | Frontend (Recharts, date picker, tables) |
| `server/routes/dashboardImpact.tsx` | SSR route for `/dash/impact` |

---

## Maintaining Performance

### If queries slow down as data grows:

1. **Check that the nightly cron is running** — matviews must be refreshed and
   CLUSTERed regularly. Stale statistics (`ANALYZE`) also hurt the planner.

2. **Increase `work_mem`** — the page and referrer queries sort large result
   sets in memory. If they spill to disk, bump `work_mem` (currently 16MB in
   dev).

3. **Consider partitioning matviews by year** — not natively supported in PG
   for matviews, but you could create separate `analytics_daily_page_2024`,
   `analytics_daily_page_2025`, etc. and UNION in the API.

4. **Pre-aggregate "top N" matviews** — a secondary view like
   `analytics_top_pages_by_community` that pre-computes the all-time top 50
   pages per community would eliminate the GROUP BY at query time, at the cost
   of losing flexible date range filtering.

5. **Increase cache TTL** — the 5-minute cache already covers repeat loads.
   Bumping to 15–30 minutes is safe for analytics data that only refreshes
   nightly.



## Impact2

Replaces the Metabase/Redshift analytics pipeline with per-community analytics sourced directly from Cloudflare's edge data. Staged as "Impact2" alongside the existing Impact tab so nothing is removed while we test.

### What this adds

**Server**
- `server/utils/cloudflareAnalytics.ts`: Cloudflare GraphQL Analytics API client. Single combined query fetches daily traffic, top paths, countries, devices, and referrers per hostname. Includes date chunking (CF max ~31 days per query), contiguous span grouping, and per-day breakdown caching.
- `server/analyticsCloudflareCache/model.ts`: Sequelize model for Postgres-backed daily cache. Past days are cached permanently; today's data has a 1-hour TTL. Auto-prunes rows older than 90 days (hourly throttle).
- `server/impact2/api.ts`: API routes (`GET /api/impact2`, `/test`, `/debug`). Resolves the Cloudflare-facing hostname by querying the Community model directly (bypasses `getInitialData`'s localhost domain overwrite in dev). Debug endpoint is disabled in production.
- Registered in `server/apiRoutes.ts`, `server/routes/index.ts`, `server/models.ts`.

**Client**
- `client/containers/DashboardImpact2/`: React component + SCSS. Top row with stat cards (color-coded left border) and area chart side by side. Four-column data grid below: Top Pages (with clickable links), Countries, Referrers, Devices (as percentage table). Responsive down to single-column on mobile.
- Date range picker: Today / 7 days / 30 days.
- Graceful degradation: friendly "not available" state when env vars are missing, stale-data callout when CF is unreachable but cache exists, standard error state with retry for transient failures.
- Registered in `client/containers/App/paths.ts`, `client/containers/index.ts`, `utils/dashboard.ts`.
- Nav button added to `ScopeDropdown`.

### Filtering and noise reduction

Two layers of filtering to get numbers closer to real human readership:

1. **Cloudflare query filters**: Only counts requests that are successful (2xx/3xx), serve HTML content, use GET method, and come from eyeball sources (not cloudflare internal routing).
2. **Server-side noise path filter**: Removes `/wp-*`, `/cdn-cgi/`, `/api/`, `/static/`, `/login`, `/robots.txt`, `.xml`, etc. from Top Pages list. Subtracts noise path page views from totals and proportionally scales visits, countries, devices, referrers, and daily chart data to match.

Raw (pre-adjustment) totals are included in the API response and shown in the footer for transparency.

### Caching strategy

- 0 Cloudflare API calls when all requested days are cached and within TTL.
- Past days: permanent cache (data is final).
- Today: 1-hour TTL, then re-fetched from CF on next request.
- Cache is Postgres-backed, so it persists across swarm deploys.

### Env vars required

```
CLOUDFLARE_ANALYTICS_API_TOKEN # API token with Analytics:Read permission
CLOUDFLARE_ZONE_TAG # Zone ID for the PubPub traffic zone
```
If missing, the server logs a warning and the client shows a "not available" message instead of erroring.