import type * as types from 'types';

import React from 'react';

import { Router } from 'express';
import { Op } from 'sequelize';

import { filtersById as spamFiltersById } from 'client/containers/SuperAdminDashboard/CommunitySpam/filters';
import { filtersById as spamUsersFiltersById } from 'client/containers/SuperAdminDashboard/UserSpam/filters';
import {
	getContentMentionsForDomain,
	getContentSearchCounts,
	getContentSearchPubs,
	getContentSearchPubsByPhrase,
} from 'server/community/contentSearchQueries';
import {
	getActivityFeed,
	getEduCollaborators,
	getEduDomainDetailData,
	getEduDomainSummaries,
} from 'server/community/eduQueries';
import { getAllTemplates } from 'server/communityTemplate/queries';
import { getExploreCommunities } from 'server/exploreFeatured/queries';
import Html from 'server/Html';
// NOTE: Suggested Hubs SSR returns an empty shell; summaries are fetched client-side on mount.
import { getAllHubsWithCommunityCounts } from 'server/hub/queries';
import { getLandingPageFeatures } from 'server/landingPageFeature/queries';
import { Community } from 'server/models';
import { queryCommunitiesForSpamManagement } from 'server/spamTag/communityDashboard';
import { queryUsersForSpamManagement } from 'server/spamTag/userDashboard';
import {
	addCustomHostname,
	isCloudflareConfigured,
	removeCustomHostname,
} from 'server/utils/cloudflareCustomHostnames';
import { BadRequestError, ForbiddenError, handleErrors, NotFoundError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import {
	getSuperAdminTabUrl,
	isSuperAdminTabKind,
	type SuperAdminTabKind,
	superAdminTabKinds,
} from 'utils/superAdmin';

export const router = Router();

const parseSpamFieldFilterParam = (
	value: string | undefined,
): types.SpamFieldsFilterKey[] | undefined => {
	if (!value) {
		return undefined;
	}

	const values = value
		.split(',')
		.map((entry) => entry.trim())
		.filter(Boolean) as types.SpamFieldsFilterKey[];

	if (values.length === 0) {
		return undefined;
	}

	return values;
};

const getTabProps = async (tabKind: SuperAdminTabKind, locationData: types.LocationData) => {
	if (tabKind === 'customDomains') {
		const communities = await Community.findAll({
			where: { domain: { [Op.ne]: null } },
			attributes: ['id', 'subdomain', 'domain', 'title'],
			order: [['domain', 'ASC']],
			raw: true,
		});
		return { communities, cloudflareConfigured: isCloudflareConfigured() };
	}
	if (tabKind === 'exploreCommunities') {
		return { communities: await getExploreCommunities() };
	}
	if (tabKind === 'landingPageFeatures') {
		return { landingPageFeatures: await getLandingPageFeatures({ onlyValidItems: false }) };
	}
	if (tabKind === 'hubs') {
		return { hubs: await getAllHubsWithCommunityCounts() };
	}
	if (tabKind === 'suggestedHubs') {
		// Return empty shell — summaries are fetched client-side for fast SSR
		return {};
	}
	if (tabKind === 'templates') {
		return { templates: await getAllTemplates() };
	}
	if (tabKind === 'spam') {
		const searchTerm = locationData.query.q ?? null;
		const { query } = spamFiltersById[searchTerm ? 'recent' : 'unreviewed'];
		const { communities, totalCount } = await queryCommunitiesForSpamManagement({
			limit: 100,
			searchTerm,
			...query!,
		});
		return {
			searchTerm,
			communities,
			totalCount,
		};
	}
	if (tabKind === 'spamUsers') {
		const searchTerm = locationData.query.q ?? null;
		const filterId = (locationData.query.filter as string) ?? 'all';
		const baseFilter = spamUsersFiltersById[filterId] ?? spamUsersFiltersById.all;
		const sortParam = locationData.query.sort as string | undefined;
		const ordering = sortParam
			? {
					field: sortParam.split(':')[0],
					direction: sortParam.split(':')[1] || 'DESC',
				}
			: baseFilter.query!.ordering;

		const spamFieldsIncludeParam =
			(locationData.query.spamFieldsInclude as string | undefined) ??
			(locationData.query.spamFields as string | undefined);
		const spamFieldsExcludeParam = locationData.query.spamFieldsExclude as string | undefined;
		const spamFieldsInclude = parseSpamFieldFilterParam(spamFieldsIncludeParam);
		const spamFieldsExclude = parseSpamFieldFilterParam(spamFieldsExcludeParam);
		const hasSpamFieldFiltersInQuery =
			spamFieldsIncludeParam != null || spamFieldsExcludeParam != null;

		const spamFieldsFilter = hasSpamFieldFiltersInQuery
			? {
					include: spamFieldsInclude,
					exclude: spamFieldsExclude,
				}
			: {
					exclude: ['automatedScan'] as types.SpamFieldsFilterKey[],
				};

		const users = await queryUsersForSpamManagement({
			limit: 50,
			searchTerm,
			includeAffiliation: true,
			...baseFilter.query!,
			ordering: ordering as any,
			communitySubdomain: (locationData.query.community as string) || undefined,
			createdAfter: (locationData.query.createdAfter as string) || undefined,
			createdBefore: (locationData.query.createdBefore as string) || undefined,
			activeAfter: (locationData.query.activeAfter as string) || undefined,
			activeBefore: (locationData.query.activeBefore as string) || undefined,
			minActivities: locationData.query.minActivities
				? Number(locationData.query.minActivities)
				: undefined,
			maxActivities: locationData.query.maxActivities
				? Number(locationData.query.maxActivities)
				: undefined,
			spamFieldsFilter,
		});
		return {
			searchTerm,
			users,
		};
	}
	return {};
};

router.get('/superadmin', async (_, res) => {
	const [firstTab] = superAdminTabKinds;
	return res.redirect(getSuperAdminTabUrl(firstTab));
});

// ── Custom Domains API ──────────────────────────────────────────────────────

router.post('/api/superadmin/custom-domains', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}
		const { communityId, domain } = req.body;
		if (!communityId || !domain) {
			throw new BadRequestError(new Error('communityId and domain are required'));
		}

		const hostname = String(domain).toLowerCase().trim();
		if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(hostname)) {
			throw new BadRequestError(new Error('Invalid domain format'));
		}

		const identifier = String(communityId).trim();
		// Support both UUID and subdomain
		const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
			identifier,
		);
		const community = isUuid
			? await Community.findByPk(identifier)
			: await Community.findOne({ where: { subdomain: identifier } });
		if (!community) {
			throw new NotFoundError(new Error('Community not found'));
		}

		// Check if domain is already in use
		const existing = await Community.findOne({ where: { domain: hostname } });
		if (existing && existing.id !== community.id) {
			throw new BadRequestError(new Error('Domain is already in use by another community'));
		}

		// Add to Cloudflare first
		await addCustomHostname(hostname);

		// Update the community
		await community.update({ domain: hostname });

		return res.json({
			id: community.id,
			subdomain: community.subdomain,
			domain: hostname,
			title: community.title,
		});
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

router.delete('/api/superadmin/custom-domains', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}
		const { communityId } = req.body;
		if (!communityId) {
			throw new BadRequestError(new Error('communityId is required'));
		}

		const community = await Community.findByPk(communityId);
		if (!community) {
			throw new NotFoundError(new Error('Community not found'));
		}

		if (community.domain) {
			// Remove from Cloudflare first
			await removeCustomHostname(community.domain);
		}

		// Clear the domain
		await community.update({ domain: null });

		return res.json({ success: true });
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

// JSON API for lazy-loading suggested-hubs sidebar summaries
router.get('/api/superadmin/suggested-hubs-summaries', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}
		const summaries = await getEduDomainSummaries({ publicOnly: true });
		return res.json(summaries);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

// JSON API for lazy-loading suggested-hubs domain detail
router.get('/api/superadmin/suggested-hubs/:domain', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}
		const { domain } = req.params;
		const results = await getEduDomainDetailData({ domain, publicOnly: true });
		const group = results[0] ?? null;
		return res.json(group);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

// JSON API for lazy-loading suggested-hubs collaborators (fetched on-demand)
router.get('/api/superadmin/suggested-hubs/:domain/collaborators', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}
		const { domain } = req.params;
		const collaborators = await getEduCollaborators(domain, { publicOnly: true });
		return res.json(collaborators);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

// JSON API for lazy-loading suggested-hubs activity feed (fetched on-demand)
router.get('/api/superadmin/suggested-hubs/:domain/activity', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}
		const { domain } = req.params;
		const feed = await getActivityFeed(domain, { publicOnly: true });
		return res.json(feed);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

// JSON API for known search term content mentions for a domain (cross-reference)
router.get('/api/superadmin/suggested-hubs/:domain/content-mentions', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}
		const { domain } = req.params;
		const mentions = await getContentMentionsForDomain(domain);
		return res.json(mentions);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

// ── Content Search APIs ─────────────────────────────────────────────────────

const CONTENT_SEARCH_CACHE_TTL_MS = 60 * 60 * 1000;
let cachedContentSearchCounts: { data: any; expiresAt: number } | null = null;

// GET /api/superadmin/content-search — known search term counts
router.get('/api/superadmin/content-search', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}

		if (cachedContentSearchCounts && Date.now() < cachedContentSearchCounts.expiresAt) {
			return res.json(cachedContentSearchCounts.data);
		}

		const terms = await getContentSearchCounts();
		const data = { terms };
		cachedContentSearchCounts = { data, expiresAt: Date.now() + CONTENT_SEARCH_CACHE_TTL_MS };
		return res.json(data);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

// GET /api/superadmin/content-search/:termIndex/pubs — pubs for a known term
router.get('/api/superadmin/content-search/:termIndex/pubs', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}

		const termIndex = parseInt(req.params.termIndex, 10);
		if (Number.isNaN(termIndex) || termIndex < 0) {
			return res.status(400).json({ error: 'Invalid term index' });
		}

		const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);
		const offset = parseInt(req.query.offset as string, 10) || 0;

		const result = await getContentSearchPubs(termIndex, { limit, offset });
		return res.json(result);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

// GET /api/superadmin/content-search/adhoc/pubs?q=phrase — ad-hoc phrase search
router.get('/api/superadmin/content-search/adhoc/pubs', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}

		const phrase = (req.query.q as string) || '';
		if (!phrase.trim()) {
			return res.json({ pubs: [], total: 0 });
		}

		const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);
		const offset = parseInt(req.query.offset as string, 10) || 0;

		const result = await getContentSearchPubsByPhrase(phrase, { limit, offset });
		return res.json(result);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

router.get('/superadmin/:tabKind', async (req, res, next) => {
	try {
		const { tabKind } = req.params;
		if (!isSuperAdminTabKind(tabKind)) {
			throw new NotFoundError();
		}
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}
		return renderToNodeStream(
			res,
			<Html
				chunkName="SuperAdminDashboard"
				initialData={initialData}
				viewData={{
					tabKind,
					tabProps: await getTabProps(tabKind, initialData.locationData),
				}}
				headerComponents={generateMetaComponents({
					initialData,
					title: 'SuperAdmin · PubPub',
					unlisted: true,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
