import { Router } from 'express';

import { HubPub } from 'server/hubPub/model';
import { addPubToHub, getHubPubs, removePubFromHub } from 'server/hubPub/queries';
import { Community, HubCommunity, HubOptOut, Member, Pub, User } from 'server/models';
import { ForbiddenError, NotFoundError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';

import { fetchBrandAssets } from './brandHelper';
import { getHubDataDashboard } from './dataQueries';
import {
	addCommunityToHub,
	addHubManager,
	createHub,
	destroyHub,
	getAllHubsWithCommunityCounts,
	getHubById,
	getHubBySlug,
	getHubCommunities,
	getHubManagers,
	getHubsForCommunity,
	isUserHubManager,
	removeCommunityFromHub,
	removeHubManager,
	updateHub,
} from './queries';
import { getSuggestedCommunities } from './suggestedCommunities';
import { getSuggestedPubs } from './suggestedPubs';

export const router = Router();

/** Require superadmin for all hub admin routes */
const requireSuperAdmin = async (req) => {
	const initialData = await getInitialData(req);
	if (!initialData.loginData.isSuperAdmin) {
		throw new ForbiddenError();
	}
	return initialData;
};

/** Require superadmin OR org manager for dashboard-level routes */
const requireSuperAdminOrOrgManager = async (req, orgId: string) => {
	const initialData = await getInitialData(req);
	if (initialData.loginData.isSuperAdmin) {
		return initialData;
	}
	if (initialData.loginData.id) {
		const isMgr = await isUserHubManager(initialData.loginData.id, orgId);
		if (isMgr) {
			return initialData;
		}
	}
	throw new ForbiddenError();
};

// GET /api/hubs - list all orgs (superadmin)
router.get('/api/hubs', async (req, res, next) => {
	try {
		await requireSuperAdmin(req);
		const hubs = await getAllHubsWithCommunityCounts();
		return res.status(200).json(hubs);
	} catch (err) {
		return next(err);
	}
});

// POST /api/hubs - create org (superadmin)
router.post('/api/hubs', async (req, res, next) => {
	try {
		await requireSuperAdmin(req);
		const {
			slug,
			title,
			subtitle,
			description,
			avatar,
			heroImage,
			heroLogo,
			accentColorLight,
			accentColorDark,
			website,
			email,
			communityCreationEnabled,
			communityCloneAccess,
			isActive,
			isPrivate,
		} = req.body;
		const org = await createHub({
			slug,
			title,
			subtitle,
			description,
			avatar,
			heroImage,
			heroLogo,
			accentColorLight,
			accentColorDark,
			website,
			email,
			communityCreationEnabled,
			communityCloneAccess,
			isActive,
			isPrivate,
		});
		return res.status(201).json(org);
	} catch (err) {
		return next(err);
	}
});

/* ------------------------------------------------------------------ */
/* Brand Helper — any logged-in user                                   */
/* ------------------------------------------------------------------ */

// GET /api/hubs/brand-helper?domain=mit.edu
router.get('/api/hubs/brand-helper', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			// Check if user is a manager of any hub
			const userId = initialData.loginData.id;
			if (!userId) throw new ForbiddenError();
			const { HubManager } = await import('server/hubManager/model.js');
			const mgr = await HubManager.findOne({ where: { userId } });
			if (!mgr) throw new ForbiddenError();
		}
		const { domain } = req.query;
		if (!domain || typeof domain !== 'string') {
			return res.status(400).json({ error: 'domain query parameter is required' });
		}
		const result = await fetchBrandAssets(domain.toLowerCase().trim());
		return res.status(200).json(result);
	} catch (err) {
		return next(err);
	}
});

// GET /api/hubs/brand-helper/proxy-image?url=... — proxy remote images to avoid CORS
router.get('/api/hubs/brand-helper/proxy-image', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			const userId = initialData.loginData.id;
			if (!userId) throw new ForbiddenError();
			const { HubManager } = await import('server/hubManager/model.js');
			const mgr = await HubManager.findOne({ where: { userId } });
			if (!mgr) throw new ForbiddenError();
		}
		const { url } = req.query;
		if (!url || typeof url !== 'string') {
			return res.status(400).json({ error: 'url query parameter is required' });
		}
		// Validate the URL is http(s)
		let parsed: URL;
		try {
			parsed = new URL(url);
		} catch {
			return res.status(400).json({ error: 'Invalid URL' });
		}
		if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
			return res.status(400).json({ error: 'Only http/https URLs are allowed' });
		}
		// Block private/internal IPs to prevent SSRF
		const hostname = parsed.hostname;
		if (
			hostname === 'localhost' ||
			hostname === '127.0.0.1' ||
			hostname === '::1' ||
			hostname === '0.0.0.0' ||
			hostname.startsWith('10.') ||
			hostname.startsWith('192.168.') ||
			hostname.startsWith('169.254.') ||
			hostname.endsWith('.internal') ||
			/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
		) {
			return res.status(400).json({ error: 'Internal addresses are not allowed' });
		}
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), 10000);
		const upstream = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; PubPub/7.0; +https://pubpub.org)',
			},
			redirect: 'follow',
			signal: controller.signal,
		});
		clearTimeout(timer);
		if (!upstream.ok) {
			return res.status(502).json({ error: `Upstream returned ${upstream.status}` });
		}
		const ct = upstream.headers.get('content-type') || 'application/octet-stream';
		// Only allow image content types
		if (!ct.startsWith('image/') && !ct.includes('svg')) {
			return res.status(400).json({ error: 'URL did not return an image' });
		}
		const buf = Buffer.from(await upstream.arrayBuffer());
		// Cap at 10MB
		if (buf.length > 10 * 1024 * 1024) {
			return res.status(413).json({ error: 'Image too large' });
		}
		res.set('Content-Type', ct);
		res.set('Content-Length', String(buf.length));
		res.set('Cache-Control', 'private, max-age=300');
		return res.send(buf);
	} catch (err) {
		return next(err);
	}
});

// PUT /api/hubs/:id - update org (superadmin or manager)
router.put('/api/hubs/:id', async (req, res, next) => {
	try {
		const initialData = await requireSuperAdminOrOrgManager(req, req.params.id);
		const {
			title,
			subtitle,
			description,
			avatar,
			heroImage,
			heroLogo,
			accentColorLight,
			accentColorDark,
			website,
			email,
			communityCreationEnabled,
			communityCloneAccess,
		} = req.body;
		const values: Record<string, any> = {
			title,
			subtitle,
			description,
			avatar,
			heroImage,
			heroLogo,
			accentColorLight,
			accentColorDark,
			website,
			email,
			communityCreationEnabled,
			communityCloneAccess,
		};
		// Only superadmins can change privileged fields
		if (initialData.loginData.isSuperAdmin) {
			const { isActive, isPrivate, slug, domains, pubSearchTerms } = req.body;
			Object.assign(values, { isActive, isPrivate, slug, domains, pubSearchTerms });
		}
		// Remove undefined keys so we don't null out fields
		Object.keys(values).forEach((k) => {
			if (values[k] === undefined) delete values[k];
		});
		const org = await updateHub(req.params.id, values);
		if (!org) {
			throw new NotFoundError();
		}
		return res.status(200).json(org.toJSON());
	} catch (err) {
		return next(err);
	}
});

// DELETE /api/hubs/:id - delete org (superadmin)
router.delete('/api/hubs/:id', async (req, res, next) => {
	try {
		await requireSuperAdmin(req);
		await destroyHub(req.params.id);
		return res.status(200).json({ success: true });
	} catch (err) {
		return next(err);
	}
});

// GET /api/hubs/:id - get org by id (superadmin or manager)
router.get('/api/hubs/:id', async (req, res, next) => {
	try {
		await requireSuperAdminOrOrgManager(req, req.params.id);
		const org = await getHubById(req.params.id);
		if (!org) {
			throw new NotFoundError();
		}
		return res.status(200).json(org.toJSON());
	} catch (err) {
		return next(err);
	}
});

// GET /api/hubs/:id/communities - list communities in org (superadmin or manager)
router.get('/api/hubs/:id/communities', async (req, res, next) => {
	try {
		await requireSuperAdminOrOrgManager(req, req.params.id);
		const communities = await getHubCommunities(req.params.id);
		return res.status(200).json(communities);
	} catch (err) {
		return next(err);
	}
});

// POST /api/hubs/:id/communities - add community to org (superadmin or manager)
router.post('/api/hubs/:id/communities', async (req, res, next) => {
	try {
		await requireSuperAdminOrOrgManager(req, req.params.id);
		let { communityId } = req.body;
		const { subdomain } = req.body;
		if (!communityId && subdomain) {
			const community = await Community.findOne({
				where: { subdomain: subdomain.toLowerCase() },
				attributes: ['id'],
			});
			if (!community) {
				return res.status(404).json({ error: `Community "${subdomain}" not found` });
			}
			communityId = community.id;
		}
		if (!communityId) {
			return res.status(400).json({ error: 'communityId or subdomain is required' });
		}
		const record = await addCommunityToHub(req.params.id, communityId);
		return res.status(201).json(record);
	} catch (err) {
		return next(err);
	}
});

// DELETE /api/hubs/:id/communities/:communityId - remove community from org (superadmin or manager)
router.delete('/api/hubs/:id/communities/:communityId', async (req, res, next) => {
	try {
		await requireSuperAdminOrOrgManager(req, req.params.id);
		await removeCommunityFromHub(req.params.id, req.params.communityId);
		return res.status(200).json({ success: true });
	} catch (err) {
		return next(err);
	}
});

// GET /api/hubs/slug/:slug/data?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// Fetch hub data dashboard with optional time range for analytics
router.get('/api/hubs/slug/:slug/data', async (req, res, next) => {
	try {
		const { slug } = req.params;
		const org = await getHubBySlug(slug);
		if (!org) throw new NotFoundError();
		const initialData = await requireSuperAdminOrOrgManager(req, org.id);

		// Inactive hubs: only superadmins can access the dashboard
		if (!org.isActive && !initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}

		const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
		const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;

		const orgData = await getHubDataDashboard(slug, {
			startDate,
			endDate,
			userId: initialData.loginData.id,
		});
		if (!orgData) throw new NotFoundError();
		return res.status(200).json(orgData);
	} catch (err) {
		return next(err);
	}
});

// PUT /api/hubs/:id/communities/:communityId — update HubCommunity settings
// body: { showOnLandingPage?, dataAccess? }
router.put('/api/hubs/:id/communities/:communityId', async (req, res, next) => {
	try {
		const initialData = await requireSuperAdminOrOrgManager(req, req.params.id);
		const { hubId, communityId } = {
			hubId: req.params.id,
			communityId: req.params.communityId,
		};
		const record = await HubCommunity.findOne({ where: { hubId, communityId } });
		if (!record) {
			throw new NotFoundError();
		}

		const updates: Record<string, any> = {};

		// showOnLandingPage — any hub manager can toggle
		if (typeof req.body.showOnLandingPage === 'boolean') {
			updates.showOnLandingPage = req.body.showOnLandingPage;
		}

		// dataAccess — hub managers can request; granting requires community admin or superadmin
		if (req.body.dataAccess) {
			const { dataAccess } = req.body;
			if (dataAccess === 'requested' && record.dataAccess === 'none') {
				// Hub manager requesting access
				updates.dataAccess = 'requested';
			} else if (dataAccess === 'granted') {
				// Must be superadmin, or both hub manager AND community admin
				if (!initialData.loginData.isSuperAdmin) {
					const member = await Member.findOne({
						where: {
							userId: initialData.loginData.id!,
							communityId,
							permissions: 'admin',
						},
					});
					if (!member) {
						return res.status(403).json({
							error: 'Must be a community admin to grant data access',
						});
					}
				}
				updates.dataAccess = 'granted';
			} else if (dataAccess === 'none') {
				// Hub manager can withdraw request, or revoke granted access
				updates.dataAccess = 'none';
			}
		}

		if (Object.keys(updates).length > 0) {
			await record.update(updates);
		}
		return res.status(200).json(record.toJSON());
	} catch (err) {
		return next(err);
	}
});

/* ------------------------------------------------------------------ */
/* Hub Managers — superadmin or org manager                    */
/* ------------------------------------------------------------------ */

// GET /api/hubs/:id/managers
router.get('/api/hubs/:id/managers', async (req, res, next) => {
	try {
		await requireSuperAdminOrOrgManager(req, req.params.id);
		const managers = await getHubManagers(req.params.id);
		return res.status(200).json(managers);
	} catch (err) {
		return next(err);
	}
});

// POST /api/hubs/:id/managers — body: { slug } (user slug) or { userId }
router.post('/api/hubs/:id/managers', async (req, res, next) => {
	try {
		await requireSuperAdminOrOrgManager(req, req.params.id);
		let { userId } = req.body;
		const { slug } = req.body;
		if (!userId && slug) {
			const user = await User.findOne({
				where: { slug: slug.toLowerCase() },
				attributes: ['id'],
			});
			if (!user) {
				return res.status(404).json({ error: `User "${slug}" not found` });
			}
			userId = user.id;
		}
		if (!userId) {
			return res.status(400).json({ error: 'userId or slug is required' });
		}
		const record = await addHubManager(req.params.id, userId);
		return res.status(201).json(record);
	} catch (err) {
		return next(err);
	}
});

// DELETE /api/hubs/:id/managers/:userId
router.delete('/api/hubs/:id/managers/:userId', async (req, res, next) => {
	try {
		await requireSuperAdminOrOrgManager(req, req.params.id);
		await removeHubManager(req.params.id, req.params.userId);
		return res.status(200).json({ success: true });
	} catch (err) {
		return next(err);
	}
});

/* ------------------------------------------------------------------ */
/* Suggested Communities — superadmin or org manager                    */
/* ------------------------------------------------------------------ */

// GET /api/hubs/:id/suggested-communities
router.get('/api/hubs/:id/suggested-communities', async (req, res, next) => {
	try {
		await requireSuperAdminOrOrgManager(req, req.params.id);
		const suggestions = await getSuggestedCommunities(req.params.id);
		return res.status(200).json(suggestions);
	} catch (err) {
		return next(err);
	}
});

/* ------------------------------------------------------------------ */
/* Curated Pubs — superadmin or org manager                            */
/* ------------------------------------------------------------------ */

// GET /api/hubs/:id/pubs — list curated pubs for this hub
router.get('/api/hubs/:id/pubs', async (req, res, next) => {
	try {
		await requireSuperAdminOrOrgManager(req, req.params.id);
		const pubs = await getHubPubs(req.params.id);
		return res.status(200).json(pubs);
	} catch (err) {
		return next(err);
	}
});

// POST /api/hubs/:id/pubs — add a pub to the hub's curated list
// body: { pubId, rank?, showOnLandingPage? }
router.post('/api/hubs/:id/pubs', async (req, res, next) => {
	try {
		await requireSuperAdminOrOrgManager(req, req.params.id);
		const { pubId, rank, showOnLandingPage } = req.body;
		if (!pubId) {
			return res.status(400).json({ error: 'pubId is required' });
		}
		const pub = await Pub.findByPk(pubId, { attributes: ['id'] });
		if (!pub) {
			return res.status(404).json({ error: 'Pub not found' });
		}
		const record = await addPubToHub(req.params.id, pubId, { rank, showOnLandingPage });
		return res.status(201).json(record);
	} catch (err) {
		return next(err);
	}
});

// PUT /api/hubs/:id/pubs/:pubId — update HubPub settings (rank, showOnLandingPage, request/grant dataAccess)
router.put('/api/hubs/:id/pubs/:pubId', async (req, res, next) => {
	try {
		await requireSuperAdminOrOrgManager(req, req.params.id);
		const record = await HubPub.findOne({
			where: { hubId: req.params.id, pubId: req.params.pubId },
		});
		if (!record) {
			throw new NotFoundError();
		}
		const updates: Record<string, any> = {};
		if (typeof req.body.showOnLandingPage === 'boolean') {
			updates.showOnLandingPage = req.body.showOnLandingPage;
		}
		if (typeof req.body.rank === 'string') {
			updates.rank = req.body.rank;
		}
		// Hub managers can request data access (none → requested)
		if (req.body.dataAccess === 'requested' && record.dataAccess === 'none') {
			updates.dataAccess = 'requested';
		}
		// Superadmins, pub admins/managers, and community admins can directly grant/revoke
		if (req.body.dataAccess === 'granted' || req.body.dataAccess === 'none') {
			const initialData = await getInitialData(req);
			let canGrant = initialData.loginData.isSuperAdmin;
			if (!canGrant && initialData.loginData.id) {
				// Check pub-level manage/admin
				const pubMember = await Member.findOne({
					where: {
						userId: initialData.loginData.id,
						pubId: req.params.pubId,
						permissions: ['manage', 'admin'],
					},
				});
				if (pubMember) {
					canGrant = true;
				} else {
					// Check community-level admin
					const pub = await Pub.findByPk(req.params.pubId, {
						attributes: ['communityId'],
					});
					if (pub) {
						const communityMember = await Member.findOne({
							where: {
								userId: initialData.loginData.id,
								communityId: pub.communityId,
								permissions: 'admin',
							},
						});
						if (communityMember) canGrant = true;
					}
				}
			}
			if (canGrant) {
				updates.dataAccess = req.body.dataAccess;
			}
		}
		if (Object.keys(updates).length > 0) {
			await record.update(updates);
		}
		return res.status(200).json(record.toJSON());
	} catch (err) {
		return next(err);
	}
});

// DELETE /api/hubs/:id/pubs/:pubId — remove a pub from the hub's curated list
router.delete('/api/hubs/:id/pubs/:pubId', async (req, res, next) => {
	try {
		await requireSuperAdminOrOrgManager(req, req.params.id);
		await removePubFromHub(req.params.id, req.params.pubId);
		return res.status(200).json({ success: true });
	} catch (err) {
		return next(err);
	}
});

// GET /api/hubs/:id/suggested-pubs
router.get('/api/hubs/:id/suggested-pubs', async (req, res, next) => {
	try {
		await requireSuperAdminOrOrgManager(req, req.params.id);
		const limit = Math.min(parseInt(String(req.query.limit), 10) || 50, 200);
		const offset = Math.max(parseInt(String(req.query.offset), 10) || 0, 0);
		const excludeCommunityIds = req.query.excludeCommunityIds
			? String(req.query.excludeCommunityIds).split(',')
			: [];
		const result = await getSuggestedPubs(req.params.id, {
			limit,
			offset,
			excludeCommunityIds,
		});
		return res.status(200).json(result);
	} catch (err) {
		return next(err);
	}
});

/* ------------------------------------------------------------------ */
/* Community curation endpoints                                        */
/* ------------------------------------------------------------------ */

/** Helper: require that the requesting user is a community admin or superadmin */
const requireCommunityAdmin = async (req, communityId: string) => {
	const initialData = await getInitialData(req);
	if (initialData.loginData.isSuperAdmin) {
		return initialData;
	}
	if (!initialData.loginData.id) {
		throw new ForbiddenError();
	}
	const member = await Member.findOne({
		where: {
			userId: initialData.loginData.id,
			communityId,
			permissions: 'admin',
		},
	});
	if (!member) {
		throw new ForbiddenError();
	}
	return initialData;
};

// GET /api/communities/:communityId/curating-hubs — list orgs curating this community
// Includes a `rejected` flag per org if the community has opted out of that org
// Includes `dataAccess` from HubCommunity so community admins can approve/deny requests
router.get('/api/communities/:communityId/curating-hubs', async (req, res, next) => {
	try {
		await requireCommunityAdmin(req, req.params.communityId);
		const orgs = await getHubsForCommunity(req.params.communityId);
		// Get all opt-outs for this community
		const optOuts = await HubOptOut.findAll({
			where: { communityId: req.params.communityId },
			attributes: ['hubId'],
		});
		const rejectedOrgIds = new Set(optOuts.map((o) => (o as any).hubId));
		// Get data access status for each hub
		const hubCommunities = await HubCommunity.findAll({
			where: { communityId: req.params.communityId },
			attributes: ['hubId', 'dataAccess'],
		});
		const dataAccessMap = new Map(
			hubCommunities.map((hc) => [(hc as any).hubId, (hc as any).dataAccess]),
		);
		const orgsWithStatus = orgs.map((org: any) => ({
			...org,
			rejected: rejectedOrgIds.has(org.id),
			dataAccess: dataAccessMap.get(org.id) || 'none',
		}));
		return res.status(200).json(orgsWithStatus);
	} catch (err) {
		return next(err);
	}
});

// POST /api/communities/:communityId/hub-opt-out — reject a specific hub (community admin)
// body: { hubId }
router.post('/api/communities/:communityId/hub-opt-out', async (req, res, next) => {
	try {
		await requireCommunityAdmin(req, req.params.communityId);
		const { hubId } = req.body;
		if (!hubId) {
			return res.status(400).json({ error: 'hubId is required' });
		}
		await HubOptOut.findOrCreate({
			where: { communityId: req.params.communityId, hubId },
		});
		return res.status(200).json({ rejected: true });
	} catch (err) {
		return next(err);
	}
});

// DELETE /api/communities/:communityId/hub-opt-out/:hubId — un-reject a hub
router.delete('/api/communities/:communityId/hub-opt-out/:hubId', async (req, res, next) => {
	try {
		await requireCommunityAdmin(req, req.params.communityId);
		await HubOptOut.destroy({
			where: {
				communityId: req.params.communityId,
				hubId: req.params.hubId,
			},
		});
		return res.status(200).json({ rejected: false });
	} catch (err) {
		return next(err);
	}
});

// PUT /api/communities/:communityId/curating-hubs/:hubId/data-access — grant or deny data access (community admin)
// body: { dataAccess: 'granted' | 'none' }
router.put(
	'/api/communities/:communityId/curating-hubs/:hubId/data-access',
	async (req, res, next) => {
		try {
			await requireCommunityAdmin(req, req.params.communityId);
			const { dataAccess } = req.body;
			if (!dataAccess || !['granted', 'none'].includes(dataAccess)) {
				return res.status(400).json({ error: "dataAccess must be 'granted' or 'none'" });
			}
			const record = await HubCommunity.findOne({
				where: {
					hubId: req.params.hubId,
					communityId: req.params.communityId,
				},
			});
			if (!record) {
				throw new NotFoundError();
			}
			await record.update({ dataAccess });
			return res.status(200).json({ dataAccess: record.dataAccess });
		} catch (err) {
			return next(err);
		}
	},
);

/* ------------------------------------------------------------------ */
/* Pub curation endpoints (pub-scope "Curated By")                     */
/* ------------------------------------------------------------------ */

/** Helper: require that the requesting user is a pub admin/manager or superadmin */
const requirePubManager = async (req, pubId: string) => {
	const initialData = await getInitialData(req);
	if (initialData.loginData.isSuperAdmin) {
		return initialData;
	}
	if (!initialData.loginData.id) {
		throw new ForbiddenError();
	}
	const member = await Member.findOne({
		where: {
			userId: initialData.loginData.id,
			pubId,
			permissions: ['manage', 'admin'],
		},
	});
	if (!member) {
		throw new ForbiddenError();
	}
	return initialData;
};

// GET /api/pubs/:pubId/curating-hubs — list hubs curating this pub
router.get('/api/pubs/:pubId/curating-hubs', async (req, res, next) => {
	try {
		await requirePubManager(req, req.params.pubId);
		const { getHubsForPub } = await import('server/hubPub/queries.js');
		const orgs = await getHubsForPub(req.params.pubId);
		return res.status(200).json(orgs);
	} catch (err) {
		return next(err);
	}
});

// DELETE /api/pubs/:pubId/curating-hubs/:hubId — remove this pub from a hub (pub manager opt-out)
router.delete('/api/pubs/:pubId/curating-hubs/:hubId', async (req, res, next) => {
	try {
		await requirePubManager(req, req.params.pubId);
		const { removePubFromHub } = await import('server/hubPub/queries.js');
		await removePubFromHub(req.params.hubId, req.params.pubId);
		return res.status(200).json({ success: true });
	} catch (err) {
		return next(err);
	}
});

// PUT /api/pubs/:pubId/curating-hubs/:hubId/data-access — grant or revoke data access (pub manager)
// body: { dataAccess: 'granted' | 'none' }
router.put('/api/pubs/:pubId/curating-hubs/:hubId/data-access', async (req, res, next) => {
	try {
		await requirePubManager(req, req.params.pubId);
		const { dataAccess } = req.body;
		if (!dataAccess || !['granted', 'none'].includes(dataAccess)) {
			return res.status(400).json({ error: "dataAccess must be 'granted' or 'none'" });
		}
		const record = await HubPub.findOne({
			where: {
				hubId: req.params.hubId,
				pubId: req.params.pubId,
			},
		});
		if (!record) {
			throw new NotFoundError();
		}
		await record.update({ dataAccess });
		return res.status(200).json({ dataAccess: record.dataAccess });
	} catch (err) {
		return next(err);
	}
});
