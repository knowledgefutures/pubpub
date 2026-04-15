/**
 * Cloudflare GraphQL Analytics API client.
 *
 * Uses the httpRequestsAdaptiveGroups dataset, filtered by clientRequestHTTPHost,
 * to get per-community (per-domain) analytics sourced from Cloudflare's edge.
 *
 * Required env vars:
 *   CLOUDFLARE_ANALYTICS_API_TOKEN – a Cloudflare API token with Analytics:Read
 *   CLOUDFLARE_ZONE_TAG             – the zone ID that fronts PubPub traffic
 */

import { env } from 'server/env';

const CF_GRAPHQL_ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';

function getConfig() {
	const apiToken = env.CLOUDFLARE_ANALYTICS_API_TOKEN;
	const zoneTag = env.CLOUDFLARE_ZONE_TAG;
	if (!apiToken || !zoneTag) {
		const missing = [
			!apiToken && 'CLOUDFLARE_ANALYTICS_API_TOKEN',
			!zoneTag && 'CLOUDFLARE_ZONE_TAG',
		].filter(Boolean);
		console.warn(
			`[Impact2] Cloudflare analytics disabled — missing env var(s): ${missing.join(', ')}. ` +
				'Set these to enable the Impact dashboard.',
		);
		return null;
	}
	return { apiToken, zoneTag };
}

export { getConfig as getCloudflareConfig };

/**
 * Run a minimal introspection query to verify the API token + zone tag work.
 * Returns { ok: true } or { ok: false, error: string }.
 */
export async function testCloudflareConnection(): Promise<{
	ok: boolean;
	error?: string;
	zoneTag?: string;
	tokenPrefix?: string;
}> {
	const config = getConfig();
	if (!config) {
		return {
			ok: false,
			error: 'Missing env vars. Set CLOUDFLARE_ANALYTICS_API_TOKEN and CLOUDFLARE_ZONE_TAG.',
		};
	}
	const { apiToken, zoneTag } = config;
	try {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const dateStr = yesterday.toISOString().slice(0, 10);
		const result = await cfGraphQL(
			`query Test($zoneTag: string, $date: Date!) {
				viewer {
					zones(filter: { zoneTag: $zoneTag }) {
						httpRequests1dGroups(limit: 1, filter: { date_gt: $date }) {
							dimensions { date }
						}
					}
				}
			}`,
			{ zoneTag, date: dateStr },
			apiToken,
		);
		const zones = result?.data?.viewer?.zones;
		if (!zones || zones.length === 0) {
			return {
				ok: false,
				error: `No zone found for zoneTag "${zoneTag}". Check CLOUDFLARE_ZONE_TAG.`,
				zoneTag,
				tokenPrefix: apiToken.slice(0, 6) + '…',
			};
		}
		return { ok: true, zoneTag, tokenPrefix: apiToken.slice(0, 6) + '…' };
	} catch (err: any) {
		return {
			ok: false,
			error: err.message ?? String(err),
			zoneTag,
			tokenPrefix: apiToken.slice(0, 6) + '…',
		};
	}
}

async function cfGraphQL(query: string, variables: Record<string, unknown>, apiToken: string) {
	const res = await fetch(CF_GRAPHQL_ENDPOINT, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiToken}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ query, variables }),
	});
	const body = await res.json();
	if (!res.ok) {
		const detail = JSON.stringify(body?.errors ?? body);
		throw new Error(
			`Cloudflare GraphQL request failed: ${res.status} ${res.statusText} – ${detail}`,
		);
	}
	if (body.errors?.length) {
		throw new Error(`Cloudflare GraphQL errors: ${JSON.stringify(body.errors)}`);
	}
	return body;
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type DailyAnalytics = {
	date: string;
	visits: number;
	pageViews: number;
};

export type TopPath = {
	path: string;
	count: number;
};

export type CountryBreakdown = {
	country: string;
	count: number;
};

export type DeviceBreakdown = {
	device: string;
	count: number;
};

export type ReferrerBreakdown = {
	referrer: string;
	count: number;
};

export type CloudflareAnalyticsResult = {
	daily: DailyAnalytics[];
	topPaths: TopPath[];
	countries: CountryBreakdown[];
	devices: DeviceBreakdown[];
	referrers: ReferrerBreakdown[];
	totals: {
		visits: number;
		pageViews: number;
	};
	/** Pre-adjustment totals (before noise/bot filtering). */
	rawTotals: {
		visits: number;
		pageViews: number;
	};
	/** True when CF returned an error (e.g. rate limit) and we fell back to cache. */
	stale?: boolean;
};

// ---------------------------------------------------------------------------
// Noise path filter — strip bot probes / infrastructure routes
// ---------------------------------------------------------------------------

const NOISE_PATH_PREFIXES = [
	'/cdn-cgi/',
	'/wp-',
	'/.env',
	'/.git',
	'/xmlrpc.php',
	'/wp-login',
	'/wp-admin',
	'/wp-content',
	'/wp-includes',
	'/api/',
	'/dist/',
	'/static/',
	'/login',
];
const NOISE_EXACT_PATHS = new Set([
	'/robots.txt',
	'/favicon.ico',
	'/sitemap.xml',
	'/sitemap_index.xml',
	'/.well-known/security.txt',
]);

function isNoisePath(path: string): boolean {
	if (NOISE_EXACT_PATHS.has(path)) return true;
	if (path.endsWith('.xml')) return true;
	return NOISE_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

// ---------------------------------------------------------------------------
// Postgres-backed daily cache
// ---------------------------------------------------------------------------
//
// Each row stores a full day's pre-aggregated analytics JSON for one hostname.
// Uses the AnalyticsCloudflareCache Sequelize model (shared Postgres → works across swarm).
//
// Past days: expiresAt = NULL → permanent cache.
// Today: expiresAt = now + 3h → cached, but refreshed periodically.
//
// Effect:
//   • First load for a community: 1 CF API call, all days stored.
//   • Repeat load within 3h: 0 CF calls, pure Postgres.
//   • After 3h: 1 CF call for just today (past days still cached permanently).

import { Op } from 'sequelize';

import { AnalyticsCloudflareCache } from 'server/analyticsCloudflareCache/model';

/** 1 hour in milliseconds. */
const TODAY_CACHE_TTL_MS = 1 * 60 * 60 * 1000;

/**
 * Delete cache rows older than 45 days.
 * We only display up to 30 days, so 45 gives a comfortable buffer.
 * Throttled to run at most once per hour — the Date.now() check is ~free,
 * so we skip the DB round-trip on 99.9% of calls. Triggered from the
 * analytics fetch path (not a background job).
 */
const CACHE_MAX_AGE_DAYS = 45;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
let lastCleanup = 0;

function pruneOldCacheRows(): Promise<void> {
	const now = Date.now();
	if (now - lastCleanup < CLEANUP_INTERVAL_MS) return Promise.resolve();
	lastCleanup = now;
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - CACHE_MAX_AGE_DAYS);
	return AnalyticsCloudflareCache.destroy({
		where: { date: { [Op.lt]: cutoff.toISOString().slice(0, 10) } },
	})
		.then(() => undefined)
		.catch((err) => {
			console.error('Analytics cache cleanup failed:', err);
		});
}

/** What we store per cached day. */
type DayCachePayload = {
	visits: number;
	pageViews: number;
	topPaths: Array<{ path: string; count: number }>;
	countries: Array<{ country: string; count: number }>;
	devices: Array<{ device: string; count: number }>;
	referrers: Array<{ referrer: string; count: number }>;
};

async function getCachedDays(
	hostname: string,
	dates: string[],
	scope = 'community',
): Promise<Map<string, DayCachePayload>> {
	if (dates.length === 0) return new Map();
	const rows = await AnalyticsCloudflareCache.findAll({
		where: {
			hostname,
			date: dates,
			scope,
			[Op.or]: [
				{ expiresAt: null }, // permanent (past days)
				{ expiresAt: { [Op.gt]: new Date() } }, // not yet expired (today)
			],
		},
	});
	const map = new Map<string, DayCachePayload>();
	for (const row of rows) {
		map.set(row.date, row.data as DayCachePayload);
	}
	return map;
}

async function storeCachedDays(
	hostname: string,
	entries: Map<string, DayCachePayload>,
	today: string,
	scope = 'community',
) {
	if (entries.size === 0) return;
	const promises = Array.from(entries.entries()).map(([date, data]) => {
		const expiresAt = date === today ? new Date(Date.now() + TODAY_CACHE_TTL_MS) : null;
		return AnalyticsCloudflareCache.upsert({ hostname, date, scope, data, expiresAt });
	});
	await Promise.all(promises);
}

// ---------------------------------------------------------------------------
// Single combined GraphQL query (1 API call per ≤30-day chunk)
// ---------------------------------------------------------------------------
//
// Fetches daily counts + all breakdowns in one request per chunk.
// Breakdowns use per-day grouping so each cached day holds its own slice.

const CF_MAX_DAYS = 30;

const COMBINED_QUERY = `
	query CommunityAnalytics($zoneTag: string, $filter: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject!) {
		viewer {
			zones(filter: { zoneTag: $zoneTag }) {
				daily: httpRequestsAdaptiveGroups(
					filter: $filter
					limit: 10000
					orderBy: [date_ASC]
				) {
					count
					sum { visits }
					dimensions { date }
				}
				topPaths: httpRequestsAdaptiveGroups(
					filter: $filter
					limit: 10000
					orderBy: [count_DESC]
				) {
					count
					dimensions { date clientRequestPath }
				}
				countries: httpRequestsAdaptiveGroups(
					filter: $filter
					limit: 200
					orderBy: [count_DESC]
				) {
					count
					dimensions { date clientCountryName }
				}
				devices: httpRequestsAdaptiveGroups(
					filter: $filter
					limit: 200
					orderBy: [count_DESC]
				) {
					count
					dimensions { date clientDeviceType }
				}
				referrers: httpRequestsAdaptiveGroups(
					filter: $filter
					limit: 200
					orderBy: [count_DESC]
				) {
					count
					dimensions { date clientRefererHost }
				}
			}
		}
	}
`;

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function dateRange(startDate: string, endDate: string): string[] {
	const dates: string[] = [];
	const cursor = new Date(startDate + 'T00:00:00Z');
	const end = new Date(endDate + 'T00:00:00Z');
	while (cursor <= end) {
		dates.push(cursor.toISOString().slice(0, 10));
		cursor.setUTCDate(cursor.getUTCDate() + 1);
	}
	return dates;
}

function splitDateRange(
	startDate: string,
	endDate: string,
	maxDays: number,
): Array<{ start: string; end: string }> {
	const chunks: Array<{ start: string; end: string }> = [];
	let cursor = new Date(startDate + 'T00:00:00Z');
	const end = new Date(endDate + 'T00:00:00Z');
	while (cursor <= end) {
		const chunkEnd = new Date(cursor);
		chunkEnd.setUTCDate(chunkEnd.getUTCDate() + maxDays - 1);
		if (chunkEnd > end) chunkEnd.setTime(end.getTime());
		chunks.push({
			start: cursor.toISOString().slice(0, 10),
			end: chunkEnd.toISOString().slice(0, 10),
		});
		cursor = new Date(chunkEnd);
		cursor.setUTCDate(cursor.getUTCDate() + 1);
	}
	return chunks;
}

/**
 * Group sorted date strings into contiguous spans.
 * e.g. ["2026-03-25", "2026-03-26", "2026-04-01"] → [["2026-03-25","2026-03-26"], ["2026-04-01"]]
 * This prevents a single CF query from spanning cached dates in the middle.
 */
function groupContiguousDates(dates: string[]): string[][] {
	if (dates.length === 0) return [];
	const spans: string[][] = [[dates[0]]];
	for (let i = 1; i < dates.length; i++) {
		const prev = new Date(dates[i - 1] + 'T00:00:00Z');
		const curr = new Date(dates[i] + 'T00:00:00Z');
		const diffMs = curr.getTime() - prev.getTime();
		if (diffMs <= 86_400_000) {
			// consecutive day
			spans[spans.length - 1].push(dates[i]);
		} else {
			spans.push([dates[i]]);
		}
	}
	return spans;
}

// ---------------------------------------------------------------------------
// Main fetch
// ---------------------------------------------------------------------------

/**
 * Fetch analytics for a hostname over a date range.
 *
 * Strategy:
 *   1. Check Postgres cache for each day in the range.
 *   2. Group uncached days into contiguous spans.
 *   3. For each span, query CF (1 API call per ≤30-day chunk) — the combined
 *      query includes `date` in every dimension so breakdowns are per-day.
 *   4. Store every fetched day (visits, pageViews, AND breakdowns) in cache.
 *   5. Aggregate all days from cache into final result.
 *
 * Cost: 0 CF API calls when all days are cached (within TTL).
 *       1 CF call per uncached ≤30-day chunk otherwise.
 */
export async function fetchCommunityAnalytics(
	hostname: string,
	startDate: string,
	endDate: string,
): Promise<CloudflareAnalyticsResult | null> {
	const config = getConfig();
	if (!config) return null;
	const { apiToken, zoneTag } = config;

	const allDates = dateRange(startDate, endDate);
	const today = new Date().toISOString().slice(0, 10);

	// 1. Read cache + prune stale rows in parallel
	const [cached] = await Promise.all([getCachedDays(hostname, allDates), pruneOldCacheRows()]);

	// 2. Fetch any uncached days from CF
	const uncachedDates = allDates.filter((d) => !cached.has(d));
	let stale = false;
	if (uncachedDates.length > 0) {
		try {
			const spans = groupContiguousDates(uncachedDates);

			async function fetchSpan(span: string[]) {
				const chunks = splitDateRange(span[0], span[span.length - 1], CF_MAX_DAYS);

				const allNodes: {
					daily: any[];
					topPaths: any[];
					countries: any[];
					devices: any[];
					referrers: any[];
				} = { daily: [], topPaths: [], countries: [], devices: [], referrers: [] };

				let chunkPromise: Promise<void> = Promise.resolve();
				for (const chunk of chunks) {
					chunkPromise = chunkPromise.then(async () => {
						// Cloudflare filter — designed to count real human page views only.
						//
						// requestSource: 'eyeball'
						//   CF built-in: excludes known bots, prefetch, and healthcheck traffic.
						//
						// edgeResponseStatus 200–399
						//   Only successful responses. Excludes 4xx (bot probes hitting
						//   /wp-login, /.env, etc. that return 404/403) and 5xx errors.
						//
						// edgeResponseContentTypeName: 'html'
						//   Only HTML page loads. Excludes asset requests (JS/CSS/images),
						//   API calls (JSON), RSS feeds (XML), and other non-page traffic.
						//
						// clientRequestHTTPMethodName: 'GET'
						//   Excludes HEAD/OPTIONS/POST probes from scanners and bots.
						//
						// Combined with the server-side isNoisePath() filter (which removes
						// /wp-*, /cdn-cgi/, /api/, /static/, /login, etc. from Top Pages
						// and proportionally adjusts all totals), these filters ensure the
						// dashboard reflects genuine human readership rather than raw
						// Cloudflare edge hit counts.
						const filter = {
							date_geq: chunk.start,
							date_leq: chunk.end,
							clientRequestHTTPHost: hostname,
							requestSource: 'eyeball',
							edgeResponseStatus_geq: 200,
							edgeResponseStatus_lt: 400,
							edgeResponseContentTypeName: 'html',
							clientRequestHTTPMethodName: 'GET',
						};
						const result = await cfGraphQL(
							COMBINED_QUERY,
							{ zoneTag, filter },
							apiToken,
						);
						const zone = result?.data?.viewer?.zones?.[0] ?? {};
						allNodes.daily.push(...(zone.daily ?? []));
						allNodes.topPaths.push(...(zone.topPaths ?? []));
						allNodes.countries.push(...(zone.countries ?? []));
						allNodes.devices.push(...(zone.devices ?? []));
						allNodes.referrers.push(...(zone.referrers ?? []));
					});
				}
				await chunkPromise;

				// Group breakdowns by date
				type Arr = Array<{ key: string; count: number }>;
				const byDate = new Map<
					string,
					{
						topPaths: Arr;
						countries: Arr;
						devices: Arr;
						referrers: Arr;
					}
				>();
				function ensure(d: string) {
					if (!byDate.has(d)) {
						byDate.set(d, { topPaths: [], countries: [], devices: [], referrers: [] });
					}
					return byDate.get(d)!;
				}
				for (const n of allNodes.topPaths) {
					ensure(n.dimensions.date).topPaths.push({
						key: n.dimensions.clientRequestPath,
						count: n.count,
					});
				}
				for (const n of allNodes.countries) {
					ensure(n.dimensions.date).countries.push({
						key: n.dimensions.clientCountryName || 'Unknown',
						count: n.count,
					});
				}
				for (const n of allNodes.devices) {
					ensure(n.dimensions.date).devices.push({
						key: n.dimensions.clientDeviceType || 'Unknown',
						count: n.count,
					});
				}
				for (const n of allNodes.referrers) {
					ensure(n.dimensions.date).referrers.push({
						key: n.dimensions.clientRefererHost || '(direct)',
						count: n.count,
					});
				}

				// Build per-day payloads
				const toStore = new Map<string, DayCachePayload>();
				for (const node of allNodes.daily) {
					const d = node.dimensions.date;
					const bd = byDate.get(d);
					const payload: DayCachePayload = {
						visits: node.sum.visits ?? 0,
						pageViews: node.count ?? 0,
						topPaths: (bd?.topPaths ?? []).map((p) => ({
							path: p.key,
							count: p.count,
						})),
						countries: (bd?.countries ?? []).map((c) => ({
							country: c.key,
							count: c.count,
						})),
						devices: (bd?.devices ?? []).map((dv) => ({
							device: dv.key,
							count: dv.count,
						})),
						referrers: (bd?.referrers ?? [])
							.map((r) => ({ referrer: r.key, count: r.count }))
							.filter((r) => r.referrer !== hostname),
					};
					cached.set(d, payload);
					toStore.set(d, payload);
				}

				// Backfill any requested dates CF returned no data for
				for (const d of span) {
					if (!cached.has(d)) {
						const empty: DayCachePayload = {
							visits: 0,
							pageViews: 0,
							topPaths: [],
							countries: [],
							devices: [],
							referrers: [],
						};
						cached.set(d, empty);
						toStore.set(d, empty);
					}
				}

				await storeCachedDays(hostname, toStore, today).catch((err) => {
					console.error('Failed to store analytics cache:', err);
				});
			}

			let spanChain: Promise<void> = Promise.resolve();
			for (const span of spans) {
				spanChain = spanChain.then(() => fetchSpan(span));
			}
			await spanChain;
		} catch (err) {
			// CF error (rate limit, network, etc.) — fall back to whatever is cached.
			console.error('Cloudflare analytics fetch failed, using cached data:', err);
			stale = cached.size > 0;
			// If we have zero cached data, re-throw so the API returns an error.
			if (cached.size === 0) throw err;
		}
	}

	// 3. Aggregate all cached days into final result
	return aggregateDays(allDates, cached, stale);
}

// ---------------------------------------------------------------------------
// Shared aggregation: turn cached days into a CloudflareAnalyticsResult
// ---------------------------------------------------------------------------

function aggregateDays(
	allDates: string[],
	cached: Map<string, DayCachePayload>,
	stale: boolean,
): CloudflareAnalyticsResult {
	const daily: DailyAnalytics[] = [];
	const pathMap = new Map<string, number>();
	const countryMap = new Map<string, number>();
	const deviceMap = new Map<string, number>();
	const refMap = new Map<string, number>();
	let totalVisits = 0;
	let totalPageViews = 0;

	for (const date of allDates) {
		const day = cached.get(date);
		if (!day) continue;
		daily.push({ date, visits: day.visits, pageViews: day.pageViews });
		totalVisits += day.visits;
		totalPageViews += day.pageViews;
		for (const p of day.topPaths) pathMap.set(p.path, (pathMap.get(p.path) ?? 0) + p.count);
		for (const c of day.countries)
			countryMap.set(c.country, (countryMap.get(c.country) ?? 0) + c.count);
		for (const d of day.devices)
			deviceMap.set(d.device, (deviceMap.get(d.device) ?? 0) + d.count);
		for (const r of day.referrers)
			refMap.set(r.referrer, (refMap.get(r.referrer) ?? 0) + r.count);
	}

	const topPaths = Array.from(pathMap.entries())
		.map(([path, count]) => ({ path, count }))
		.filter((p) => !isNoisePath(p.path))
		.sort((a, b) => b.count - a.count)
		.slice(0, 50);

	let noisePageViews = 0;
	for (const [path, count] of pathMap) {
		if (isNoisePath(path)) noisePageViews += count;
	}
	const adjustedPageViews = Math.max(0, totalPageViews - noisePageViews);
	const ratio = totalPageViews > 0 ? adjustedPageViews / totalPageViews : 1;
	const adjustedVisits = Math.round(totalVisits * ratio);

	const adjustedDaily = daily.map((d) => ({
		date: d.date,
		visits: Math.round(d.visits * ratio),
		pageViews: Math.round(d.pageViews * ratio),
	}));

	const countries = Array.from(countryMap.entries())
		.map(([country, count]) => ({ country, count: Math.round(count * ratio) }))
		.filter((c) => c.count > 0)
		.sort((a, b) => b.count - a.count)
		.slice(0, 20);

	const devices = Array.from(deviceMap.entries())
		.map(([device, count]) => ({ device, count: Math.round(count * ratio) }))
		.filter((d) => d.count > 0)
		.sort((a, b) => b.count - a.count);

	const referrers = Array.from(refMap.entries())
		.map(([referrer, count]) => ({ referrer, count: Math.round(count * ratio) }))
		.filter((r) => r.count > 0)
		.sort((a, b) => b.count - a.count)
		.slice(0, 15);

	return {
		daily: adjustedDaily,
		topPaths,
		countries,
		devices,
		referrers,
		totals: { visits: adjustedVisits, pageViews: adjustedPageViews },
		rawTotals: { visits: totalVisits, pageViews: totalPageViews },
		...(stale ? { stale: true } : {}),
	};
}

// ---------------------------------------------------------------------------
// Pub-scope fetch (single CF query with path prefix filter)
// ---------------------------------------------------------------------------

/**
 * Fetch analytics scoped to a single pub.
 *
 * Uses the same combined query but adds clientRequestPath_like to filter to
 * /pub/{slug}%. Cached separately under scope='pub:{slug}'.
 *
 * Cost: 0 CF calls when cached. 1 call per ≤30-day chunk when not.
 */
export async function fetchPubAnalytics(
	hostname: string,
	pubSlug: string,
	startDate: string,
	endDate: string,
): Promise<CloudflareAnalyticsResult | null> {
	const config = getConfig();
	if (!config) return null;
	const { apiToken, zoneTag } = config;

	const scope = `pub:${pubSlug}`;
	const pathPrefix = `/pub/${pubSlug}`;
	const allDates = dateRange(startDate, endDate);
	const today = new Date().toISOString().slice(0, 10);

	const [cached] = await Promise.all([
		getCachedDays(hostname, allDates, scope),
		pruneOldCacheRows(),
	]);

	const uncachedDates = allDates.filter((d) => !cached.has(d));
	let stale = false;

	if (uncachedDates.length > 0) {
		try {
			const spans = groupContiguousDates(uncachedDates);

			async function fetchSpan(span: string[]) {
				const chunks = splitDateRange(span[0], span[span.length - 1], CF_MAX_DAYS);
				const allNodes: {
					daily: any[];
					topPaths: any[];
					countries: any[];
					devices: any[];
					referrers: any[];
				} = { daily: [], topPaths: [], countries: [], devices: [], referrers: [] };

				let chunkPromise: Promise<void> = Promise.resolve();
				for (const chunk of chunks) {
					chunkPromise = chunkPromise.then(async () => {
						const filter = {
							date_geq: chunk.start,
							date_leq: chunk.end,
							clientRequestHTTPHost: hostname,
							clientRequestPath_like: `${pathPrefix}%`,
							requestSource: 'eyeball',
							edgeResponseStatus_geq: 200,
							edgeResponseStatus_lt: 400,
							edgeResponseContentTypeName: 'html',
							clientRequestHTTPMethodName: 'GET',
						};
						const result = await cfGraphQL(
							COMBINED_QUERY,
							{ zoneTag, filter },
							apiToken,
						);
						const zone = result?.data?.viewer?.zones?.[0] ?? {};
						allNodes.daily.push(...(zone.daily ?? []));
						allNodes.topPaths.push(...(zone.topPaths ?? []));
						allNodes.countries.push(...(zone.countries ?? []));
						allNodes.devices.push(...(zone.devices ?? []));
						allNodes.referrers.push(...(zone.referrers ?? []));
					});
				}
				await chunkPromise;

				// Group breakdowns by date
				type Arr = Array<{ key: string; count: number }>;
				const byDate = new Map<
					string,
					{ topPaths: Arr; countries: Arr; devices: Arr; referrers: Arr }
				>();
				function ensure(d: string) {
					if (!byDate.has(d))
						byDate.set(d, { topPaths: [], countries: [], devices: [], referrers: [] });
					return byDate.get(d)!;
				}
				for (const n of allNodes.topPaths) {
					ensure(n.dimensions.date).topPaths.push({
						key: n.dimensions.clientRequestPath,
						count: n.count,
					});
				}
				for (const n of allNodes.countries) {
					ensure(n.dimensions.date).countries.push({
						key: n.dimensions.clientCountryName || 'Unknown',
						count: n.count,
					});
				}
				for (const n of allNodes.devices) {
					ensure(n.dimensions.date).devices.push({
						key: n.dimensions.clientDeviceType || 'Unknown',
						count: n.count,
					});
				}
				for (const n of allNodes.referrers) {
					ensure(n.dimensions.date).referrers.push({
						key: n.dimensions.clientRefererHost || '(direct)',
						count: n.count,
					});
				}

				const toStore = new Map<string, DayCachePayload>();
				for (const node of allNodes.daily) {
					const d = node.dimensions.date;
					const bd = byDate.get(d);
					const payload: DayCachePayload = {
						visits: node.sum.visits ?? 0,
						pageViews: node.count ?? 0,
						topPaths: (bd?.topPaths ?? []).map((p) => ({
							path: p.key,
							count: p.count,
						})),
						countries: (bd?.countries ?? []).map((c) => ({
							country: c.key,
							count: c.count,
						})),
						devices: (bd?.devices ?? []).map((dv) => ({
							device: dv.key,
							count: dv.count,
						})),
						referrers: (bd?.referrers ?? [])
							.map((r) => ({ referrer: r.key, count: r.count }))
							.filter((r) => r.referrer !== hostname),
					};
					cached.set(d, payload);
					toStore.set(d, payload);
				}

				for (const d of span) {
					if (!cached.has(d)) {
						const empty: DayCachePayload = {
							visits: 0,
							pageViews: 0,
							topPaths: [],
							countries: [],
							devices: [],
							referrers: [],
						};
						cached.set(d, empty);
						toStore.set(d, empty);
					}
				}

				await storeCachedDays(hostname, toStore, today, scope).catch((err) => {
					console.error('Failed to store pub analytics cache:', err);
				});
			}

			let spanChain: Promise<void> = Promise.resolve();
			for (const span of spans) {
				spanChain = spanChain.then(() => fetchSpan(span));
			}
			await spanChain;
		} catch (err) {
			console.error('Cloudflare pub analytics fetch failed, using cached data:', err);
			stale = cached.size > 0;
			if (cached.size === 0) throw err;
		}
	}

	return aggregateDays(allDates, cached, stale);
}

// ---------------------------------------------------------------------------
// Generic path-prefix scope cache (used by collection aggregation)
// ---------------------------------------------------------------------------

/**
 * Ensure we have a cached scope for a given path prefix and date range.
 *
 * Queries CF with `clientRequestPath_like` set to the given path prefix,
 * storing results under the given scope key.
 *
 * Used for:
 *   - 'all-pub-paths' (pathLike = '/pub/%') — top 1000 pub-specific paths
 *   - 'collection-page:{slug}' (pathLike = '/{slug}%') — collection page data
 *
 * Cost: 1 CF query per ≤30-day chunk when not cached, 0 when cached.
 */
async function ensurePathScopeCached(
	hostname: string,
	allDates: string[],
	apiToken: string,
	zoneTag: string,
	pathLike: string,
	scope: string,
): Promise<{ cache: Map<string, DayCachePayload>; stale: boolean }> {
	const today = new Date().toISOString().slice(0, 10);
	const cached = await getCachedDays(hostname, allDates, scope);
	const uncachedDates = allDates.filter((d) => !cached.has(d));
	let stale = false;

	if (uncachedDates.length > 0) {
		try {
			const spans = groupContiguousDates(uncachedDates);

			async function fetchSpan(span: string[]) {
				const chunks = splitDateRange(span[0], span[span.length - 1], CF_MAX_DAYS);
				const allNodes: {
					daily: any[];
					topPaths: any[];
					countries: any[];
					devices: any[];
					referrers: any[];
				} = { daily: [], topPaths: [], countries: [], devices: [], referrers: [] };

				let chunkPromise: Promise<void> = Promise.resolve();
				for (const chunk of chunks) {
					chunkPromise = chunkPromise.then(async () => {
						const filter = {
							date_geq: chunk.start,
							date_leq: chunk.end,
							clientRequestHTTPHost: hostname,
							clientRequestPath_like: pathLike,
							requestSource: 'eyeball',
							edgeResponseStatus_geq: 200,
							edgeResponseStatus_lt: 400,
							edgeResponseContentTypeName: 'html',
							clientRequestHTTPMethodName: 'GET',
						};
						const result = await cfGraphQL(
							COMBINED_QUERY,
							{ zoneTag, filter },
							apiToken,
						);
						const zone = result?.data?.viewer?.zones?.[0] ?? {};
						allNodes.daily.push(...(zone.daily ?? []));
						allNodes.topPaths.push(...(zone.topPaths ?? []));
						allNodes.countries.push(...(zone.countries ?? []));
						allNodes.devices.push(...(zone.devices ?? []));
						allNodes.referrers.push(...(zone.referrers ?? []));
					});
				}
				await chunkPromise;

				// Group breakdowns by date
				type Arr = Array<{ key: string; count: number }>;
				const byDate = new Map<
					string,
					{ topPaths: Arr; countries: Arr; devices: Arr; referrers: Arr }
				>();
				function ensure(d: string) {
					if (!byDate.has(d))
						byDate.set(d, { topPaths: [], countries: [], devices: [], referrers: [] });
					return byDate.get(d)!;
				}
				for (const n of allNodes.topPaths) {
					ensure(n.dimensions.date).topPaths.push({
						key: n.dimensions.clientRequestPath,
						count: n.count,
					});
				}
				for (const n of allNodes.countries) {
					ensure(n.dimensions.date).countries.push({
						key: n.dimensions.clientCountryName || 'Unknown',
						count: n.count,
					});
				}
				for (const n of allNodes.devices) {
					ensure(n.dimensions.date).devices.push({
						key: n.dimensions.clientDeviceType || 'Unknown',
						count: n.count,
					});
				}
				for (const n of allNodes.referrers) {
					ensure(n.dimensions.date).referrers.push({
						key: n.dimensions.clientRefererHost || '(direct)',
						count: n.count,
					});
				}

				const toStore = new Map<string, DayCachePayload>();
				for (const node of allNodes.daily) {
					const d = node.dimensions.date;
					const bd = byDate.get(d);
					const payload: DayCachePayload = {
						visits: node.sum.visits ?? 0,
						pageViews: node.count ?? 0,
						topPaths: (bd?.topPaths ?? []).map((p) => ({
							path: p.key,
							count: p.count,
						})),
						countries: (bd?.countries ?? []).map((c) => ({
							country: c.key,
							count: c.count,
						})),
						devices: (bd?.devices ?? []).map((dv) => ({
							device: dv.key,
							count: dv.count,
						})),
						referrers: (bd?.referrers ?? [])
							.map((r) => ({ referrer: r.key, count: r.count }))
							.filter((r) => r.referrer !== hostname),
					};
					cached.set(d, payload);
					toStore.set(d, payload);
				}

				for (const d of span) {
					if (!cached.has(d)) {
						const empty: DayCachePayload = {
							visits: 0,
							pageViews: 0,
							topPaths: [],
							countries: [],
							devices: [],
							referrers: [],
						};
						cached.set(d, empty);
						toStore.set(d, empty);
					}
				}

				await storeCachedDays(hostname, toStore, today, scope).catch((err) => {
					console.error(`Failed to store ${scope} cache:`, err);
				});
			}

			let spanChain: Promise<void> = Promise.resolve();
			for (const span of spans) {
				spanChain = spanChain.then(() => fetchSpan(span));
			}
			await spanChain;
		} catch (err) {
			console.error(`Cloudflare ${scope} fetch failed, falling back:`, err);
			stale = cached.size > 0;
		}
	}

	return { cache: cached, stale };
}

// ---------------------------------------------------------------------------
// Collection-scope fetch (dedicated queries + pub cache enrichment)
// ---------------------------------------------------------------------------

/**
 * Fetch analytics scoped to a collection.
 *
 * Strategy:
 *   1. Ensure community-level data is cached (for fallback breakdowns).
 *   2. Dedicated CF query for the collection page itself (/{slug}%),
 *      cached as 'collection-page:{slug}'. Guarantees the collection
 *      always has *some* data even if it's outside any top-paths list.
 *   3. Dedicated CF query for all pub paths (/pub/%), cached as
 *      'all-pub-paths'. Top 1000 pub-specific paths — much better
 *      coverage than filtering the community top 1000.
 *   4. For each pub in the collection, prefer individual pub-level cache
 *      (most accurate), then fall back to all-pub-paths, then community.
 *   5. Countries/devices/referrers: proportional from all-pub-paths
 *      breakdowns, falling back to community breakdowns.
 *
 * Cost: 0 when fully cached. At most 3 CF queries when cold
 *        (community + all-pub-paths + collection-page), but typically
 *        community is already warm, so 2 in practice.
 */
export async function fetchCollectionAnalytics(
	hostname: string,
	collectionSlug: string,
	pubSlugs: string[],
	startDate: string,
	endDate: string,
): Promise<CloudflareAnalyticsResult | null> {
	const config = getConfig();
	if (!config) return null;
	const { apiToken, zoneTag } = config;

	const allDates = dateRange(startDate, endDate);

	// 1. Ensure community data is cached (for breakdowns + fallback)
	const communityResult = await fetchCommunityAnalytics(hostname, startDate, endDate);
	if (!communityResult) return null;

	// 2 & 3. Fetch collection-page and all-pub-paths scopes in parallel
	const [collectionPageResult, allPubPathsResult] = await Promise.all([
		ensurePathScopeCached(
			hostname,
			allDates,
			apiToken,
			zoneTag,
			`/${collectionSlug}%`,
			`collection-page:${collectionSlug}`,
		),
		ensurePathScopeCached(hostname, allDates, apiToken, zoneTag, '/pub/%', 'all-pub-paths'),
	]);
	const collectionPageCached = collectionPageResult.cache;
	const allPubPathsCached = allPubPathsResult.cache;

	// 4. Read community-level cached days (raw, pre-aggregation)
	const communityCached = await getCachedDays(hostname, allDates, 'community');

	// 5. For each pub, check if we have pub-scoped cache (most accurate)
	const pubCacheEntries = await Promise.all(
		pubSlugs.map(async (slug) => {
			const pubCache = await getCachedDays(hostname, allDates, `pub:${slug}`);
			return [slug, pubCache] as const;
		}),
	);
	const pubCaches = new Map<string, Map<string, DayCachePayload>>();
	for (const [slug, cache] of pubCacheEntries) {
		if (cache.size > 0) {
			pubCaches.set(slug, cache);
		}
	}

	// 6. Build collection-scoped day payloads by merging sources
	const collectionDays = new Map<string, DayCachePayload>();

	for (const date of allDates) {
		const communityDay = communityCached.get(date);
		if (!communityDay) continue;

		const allPubPathsDay = allPubPathsCached.get(date);
		const collectionPageDay = collectionPageCached.get(date);

		let dayVisits = 0;
		let dayPageViews = 0;
		const dayPaths: Array<{ path: string; count: number }> = [];
		const slugsHandledByPubCache = new Set<string>();

		// (a) Add data from any individual pub-level caches (most accurate)
		for (const [slug, cache] of pubCaches) {
			const pubDay = cache.get(date);
			if (pubDay) {
				slugsHandledByPubCache.add(slug);
				dayVisits += pubDay.visits;
				dayPageViews += pubDay.pageViews;
				for (const p of pubDay.topPaths) dayPaths.push(p);
			}
		}

		// (b) For pubs without individual cache, use all-pub-paths topPaths
		//     (top 1000 /pub/* paths — much better coverage than community top 1000).
		//     Falls back to community topPaths if all-pub-paths cache is unavailable.
		const pubPathSource = allPubPathsDay?.topPaths ?? communityDay.topPaths;
		for (const p of pubPathSource) {
			// Skip paths already covered by individual pub-level cache
			const coveredByPubCache = pubSlugs.some(
				(slug) =>
					slugsHandledByPubCache.has(slug) &&
					(p.path === `/pub/${slug}` || p.path.startsWith(`/pub/${slug}/`)),
			);
			if (coveredByPubCache) continue;

			// Check if this path belongs to a collection pub
			const isPubInCollection = pubSlugs.some(
				(slug) => p.path === `/pub/${slug}` || p.path.startsWith(`/pub/${slug}/`),
			);
			if (isPubInCollection) {
				dayPageViews += p.count;
				dayPaths.push(p);
			}
		}

		// (c) Collection layout page — from dedicated collection-page cache
		//     (guaranteed data even if the page isn't in any top-paths list).
		//     Falls back to community topPaths if the dedicated cache failed.
		if (collectionPageDay && collectionPageDay.pageViews > 0) {
			dayVisits += collectionPageDay.visits;
			dayPageViews += collectionPageDay.pageViews;
			for (const p of collectionPageDay.topPaths) dayPaths.push(p);
		} else {
			// Fallback: filter community topPaths for collection page
			for (const p of communityDay.topPaths) {
				if (p.path === `/${collectionSlug}` || p.path.startsWith(`/${collectionSlug}/`)) {
					dayPageViews += p.count;
					dayPaths.push(p);
				}
			}
		}

		// Estimate visits proportionally from community day
		// (for paths from community/all-pub-paths data, not from individual pub cache
		// or the collection-page dedicated cache which has its own visits)
		if (communityDay.pageViews > 0 && dayPageViews > 0) {
			const directVisitSources =
				[...pubCaches.values()].reduce(
					(sum, cache) => sum + (cache.get(date)?.pageViews ?? 0),
					0,
				) +
				(collectionPageDay && collectionPageDay.pageViews > 0
					? collectionPageDay.pageViews
					: 0);
			const indirectPageViews = dayPageViews - directVisitSources;
			if (indirectPageViews > 0) {
				const visitRatio = communityDay.visits / communityDay.pageViews;
				dayVisits += Math.round(indirectPageViews * visitRatio);
			}
		}

		// Countries/devices/referrers: use all-pub-paths breakdowns if available
		// (more accurate for pub-heavy collections), else community-level.
		// Scaled by this collection's share of the source's total traffic.
		const breakdownSource = allPubPathsDay ?? communityDay;
		const sourcePageViews = allPubPathsDay ? allPubPathsDay.pageViews : communityDay.pageViews;
		const shareRatio = sourcePageViews > 0 ? dayPageViews / sourcePageViews : 0;

		collectionDays.set(date, {
			visits: dayVisits,
			pageViews: dayPageViews,
			topPaths: dayPaths,
			countries: breakdownSource.countries
				.map((c) => ({
					country: c.country,
					count: Math.round(c.count * shareRatio),
				}))
				.filter((c) => c.count > 0),
			devices: breakdownSource.devices
				.map((d) => ({
					device: d.device,
					count: Math.round(d.count * shareRatio),
				}))
				.filter((d) => d.count > 0),
			referrers: breakdownSource.referrers
				.map((r) => ({
					referrer: r.referrer,
					count: Math.round(r.count * shareRatio),
				}))
				.filter((r) => r.count > 0),
		});
	}

	const anyStale =
		!!communityResult.stale || allPubPathsResult.stale || collectionPageResult.stale;
	return aggregateDays(allDates, collectionDays, anyStale);
}

// ---------------------------------------------------------------------------
// Debug helper
// ---------------------------------------------------------------------------

/**
 * Raw debug query — returns the exact filter + raw Cloudflare response.
 */
export async function debugCommunityAnalytics(
	hostname: string,
	startDate: string,
	endDate: string,
) {
	const config = getConfig();
	if (!config) {
		return { error: 'Missing env vars' };
	}
	const { apiToken, zoneTag } = config;

	const filter = {
		date_geq: startDate,
		date_leq: endDate,
		clientRequestHTTPHost: hostname,
		requestSource: 'eyeball',
		edgeResponseStatus_geq: 200,
		edgeResponseStatus_lt: 400,
		edgeResponseContentTypeName: 'html',
		clientRequestHTTPMethodName: 'GET',
	};

	const zoneCheckQuery = `
		query ZoneCheck($zoneTag: string) {
			viewer {
				zones(filter: { zoneTag: $zoneTag }) {
					totals: httpRequestsAdaptiveGroups(
						filter: { date_geq: "${startDate}", date_leq: "${endDate}", requestSource: "eyeball" }
						limit: 5
						orderBy: [count_DESC]
					) {
						count
						dimensions { date }
					}
				}
			}
		}
	`;

	const hostnameQuery = `
		query HostnameCheck($zoneTag: string, $filter: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject!) {
			viewer {
				zones(filter: { zoneTag: $zoneTag }) {
					daily: httpRequestsAdaptiveGroups(
						filter: $filter
						limit: 5
						orderBy: [count_DESC]
					) {
						count
						sum { visits }
						dimensions { date clientRequestHTTPHost }
					}
				}
			}
		}
	`;

	const hostnamesQuery = `
		query Hostnames($zoneTag: string) {
			viewer {
				zones(filter: { zoneTag: $zoneTag }) {
					byHost: httpRequestsAdaptiveGroups(
						filter: { date_geq: "${startDate}", date_leq: "${endDate}", requestSource: "eyeball" }
						limit: 25
						orderBy: [count_DESC]
					) {
						count
						dimensions { clientRequestHTTPHost }
					}
				}
			}
		}
	`;

	let zoneCheck: any;
	let hostnameCheck: any;
	let hostnamesCheck: any;

	try {
		zoneCheck = await cfGraphQL(zoneCheckQuery, { zoneTag }, apiToken);
	} catch (err: any) {
		zoneCheck = { error: err.message };
	}
	try {
		hostnameCheck = await cfGraphQL(hostnameQuery, { zoneTag, filter }, apiToken);
	} catch (err: any) {
		hostnameCheck = { error: err.message };
	}
	try {
		hostnamesCheck = await cfGraphQL(hostnamesQuery, { zoneTag }, apiToken);
	} catch (err: any) {
		hostnamesCheck = { error: err.message };
	}

	return {
		input: {
			hostname,
			startDate,
			endDate,
			zoneTag,
			tokenPrefix: apiToken.slice(0, 6) + '…',
			filter,
		},
		zoneWideData: zoneCheck,
		filteredByHostname: hostnameCheck,
		topHostnames: hostnamesCheck,
	};
}
