import type { CloudflareAnalyticsResult } from 'server/utils/cloudflareAnalytics';

import { Router } from 'express';
import { Op } from 'sequelize';

import { Collection } from 'server/collection/model';
import { CollectionPub } from 'server/collectionPub/model';
import { Community } from 'server/community/model';
import { Page } from 'server/page/model';
import { Pub } from 'server/pub/model';
import {
	debugCommunityAnalytics,
	fetchCollectionAnalytics,
	fetchCommunityAnalytics,
	fetchPubAnalytics,
	testCloudflareConnection,
} from 'server/utils/cloudflareAnalytics';
import { ForbiddenError, handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';

export const router = Router();

/**
 * Build a slug → title map for paths in the analytics result.
 *
 * Extracts pub slugs from /pub/{slug}[/...] and top-level slugs from /{slug},
 * then batch-queries Pub, Collection, and Page tables. Returns a map from
 * the *base path* (e.g. '/pub/my-pub' or '/my-collection') to its title.
 */
async function resolvePathTitles(
	result: CloudflareAnalyticsResult,
	communityId: string,
): Promise<Record<string, string>> {
	const pubSlugs = new Set<string>();
	const topLevelSlugs = new Set<string>();

	for (const { path } of result.topPaths) {
		const pubMatch = path.match(/^\/pub\/([^/]+)/);
		if (pubMatch) {
			pubSlugs.add(pubMatch[1]);
		} else {
			const topMatch = path.match(/^\/([^/]+)/);
			if (topMatch) {
				topLevelSlugs.add(topMatch[1]);
			}
		}
	}

	const titles: Record<string, string> = {};

	// Batch-query pub titles
	if (pubSlugs.size > 0) {
		const pubs = await Pub.findAll({
			where: { communityId, slug: { [Op.in]: [...pubSlugs] } },
			attributes: ['slug', 'title'],
		});
		for (const p of pubs) {
			titles[`/pub/${p.slug}`] = p.title;
		}
	}

	// Batch-query collection + page titles for top-level slugs
	if (topLevelSlugs.size > 0) {
		const slugArr = [...topLevelSlugs];
		const [collections, pages] = await Promise.all([
			Collection.findAll({
				where: { communityId, slug: { [Op.in]: slugArr } },
				attributes: ['slug', 'title'],
			}),
			Page.findAll({
				where: { communityId, slug: { [Op.in]: slugArr } },
				attributes: ['slug', 'title'],
			}),
		]);
		for (const c of collections) {
			titles[`/${c.slug}`] = c.title;
		}
		for (const p of pages) {
			// Don't overwrite if a collection already matched
			if (!titles[`/${p.slug}`]) {
				titles[`/${p.slug}`] = p.title;
			}
		}
	}

	return titles;
}

/**
 * Resolve the hostname Cloudflare actually sees for a community.
 *
 * We query the Community model directly because getInitialData overwrites
 * communityData.domain with the localhost proxy header in dev mode.
 *
 * Priority:
 *   1. Raw `domain` column from the DB (if it's a real domain, not localhost).
 *   2. Fallback to {subdomain}.pubpub.org.
 */
async function resolveCloudflareHostname(communityId: string): Promise<string> {
	const row = await Community.findByPk(communityId, {
		attributes: ['subdomain', 'domain'],
	});
	if (!row) {
		throw new Error(`Community not found: ${communityId}`);
	}
	const { domain, subdomain } = row;
	if (domain && !domain.includes('localhost') && !domain.includes('127.0.0.1')) {
		// Strip port if present (shouldn't be in prod, but just in case)
		return domain.replace(/:\d+$/, '');
	}
	return `${subdomain}.pubpub.org`;
}

/**
 * GET /api/impact2/test
 *
 * Quick diagnostic to verify Cloudflare env vars are set and working.
 * Returns JSON with { ok, error?, zoneTag?, tokenPrefix? }.
 */
router.get('/api/impact2/test', async (_req, res) => {
	const result = await testCloudflareConnection();
	const status = result.ok ? 200 : 503;
	return res.status(status).json(result);
});

/**
 * GET /api/impact2/debug
 *
 * Shows the exact hostname being used, the filter sent to Cloudflare,
 * raw CF responses, and which hostnames actually have data in the zone.
 * Accepts optional ?hostname=override&startDate=...&endDate=...
 *
 * Only available in non-production environments.
 */
router.get('/api/impact2/debug', async (req, res, next) => {
	if (process.env.NODE_ENV === 'production') {
		return res.status(404).json({ error: 'Not available in production' });
	}
	try {
		if (!hostIsValid(req, 'community')) {
			return next();
		}
		const initialData = await getInitialData(req, { isDashboard: true });
		const { canView } = initialData.scopeData.activePermissions;
		if (!canView) {
			throw new ForbiddenError();
		}

		const communityData = initialData.communityData;
		const defaultHostname = await resolveCloudflareHostname(communityData.id);
		const hostname = (req.query.hostname as string) || defaultHostname;

		const now = new Date();
		const defaultStart = new Date(now);
		defaultStart.setDate(defaultStart.getDate() - 7);

		const startDate =
			(req.query.startDate as string) || defaultStart.toISOString().slice(0, 10);
		const endDate = (req.query.endDate as string) || now.toISOString().slice(0, 10);

		const result = await debugCommunityAnalytics(hostname, startDate, endDate);
		return res.json({
			communityFromDb: {
				subdomain: communityData.subdomain,
				domainRaw: communityData.domain,
				resolvedHostname: defaultHostname,
			},
			overrideHostname: req.query.hostname || null,
			...result,
		});
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

/**
 * GET /api/impact2
 *
 * Returns Cloudflare-sourced analytics for the current scope.
 * Query params:
 *   startDate – ISO date (e.g. "2026-03-01"). Defaults to 30 days ago.
 *   endDate   – ISO date (e.g. "2026-03-31"). Defaults to today.
 *   pubSlug   – if set, returns pub-scoped analytics (CF path filter).
 *   collectionId – if set, returns collection-scoped analytics (merged).
 */
router.get('/api/impact2', async (req, res, next) => {
	try {
		if (!hostIsValid(req, 'community')) {
			return next();
		}
		const initialData = await getInitialData(req, { isDashboard: true });
		const { canView } = initialData.scopeData.activePermissions;
		if (!canView) {
			throw new ForbiddenError();
		}

		const communityData = initialData.communityData;
		const hostname = await resolveCloudflareHostname(communityData.id);

		const now = new Date();
		const defaultStart = new Date(now);
		defaultStart.setDate(defaultStart.getDate() - 30);

		const startDate =
			(req.query.startDate as string) || defaultStart.toISOString().slice(0, 10);
		const endDate = (req.query.endDate as string) || now.toISOString().slice(0, 10);

		const pubSlug = req.query.pubSlug as string | undefined;
		const collectionId = req.query.collectionId as string | undefined;

		let result;

		if (pubSlug) {
			// Pub scope: CF query filtered by path prefix
			result = await fetchPubAnalytics(hostname, pubSlug, startDate, endDate);
		} else if (collectionId) {
			// Collection scope: community data + pub cache enrichment
			const collection = await Collection.findByPk(collectionId, {
				attributes: ['slug'],
			});
			if (!collection) {
				return res.status(404).json({ error: 'Collection not found' });
			}
			const collectionPubs = await CollectionPub.findAll({
				where: { collectionId },
				include: [{ model: Pub, as: 'pub', attributes: ['slug'] }],
			});
			const pubSlugs = collectionPubs
				.map((cp) => cp.pub?.slug)
				.filter((s): s is string => !!s);

			result = await fetchCollectionAnalytics(
				hostname,
				collection.slug,
				pubSlugs,
				startDate,
				endDate,
			);
		} else {
			// Community scope (default)
			result = await fetchCommunityAnalytics(hostname, startDate, endDate);
		}

		if (!result) {
			return res.status(503).json({
				error: 'Cloudflare analytics not configured. Set CLOUDFLARE_ANALYTICS_API_TOKEN and CLOUDFLARE_ZONE_TAG environment variables.',
			});
		}

		// Enrich with titles looked up from the DB (not cached — titles can change)
		const pathTitles = await resolvePathTitles(result, communityData.id);

		return res.json({ ...result, pathTitles });
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
