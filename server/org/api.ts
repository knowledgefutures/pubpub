import type { MemberPermission } from 'types';

import { Router } from 'express';

import { fetchUserOrgs } from 'server/kf/oidc.server';
import { Community, OrgMember, Pub, User } from 'server/models';
import { OrgFeaturedPub } from 'server/orgFeaturedPub/model';
import { addPubToOrg, getOrgFeaturedPubs, removePubFromOrg } from 'server/orgFeaturedPub/queries';
import { BadRequestError, ForbiddenError, NotFoundError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { memberPermissions } from 'types';

import { fetchBrandAssets } from './brandHelper';
import { getOrgDataDashboard } from './dataQueries';
import {
	addCommunityToOrg,
	addOrgMember,
	createOrg,
	destroyOrg,
	getAllOrgsWithCommunityCounts,
	getOrgById,
	getOrgBySlug,
	getOrgCommunities,
	getOrgMembers,
	isUserOrgAdmin,
	isUserOrgMember,
	removeCommunityFromOrg,
	removeOrgMember,
	updateOrg,
} from './queries';
import { getSuggestedCommunities } from './suggestedCommunities';
import { getSuggestedPubs } from './suggestedPubs';

export const router = Router();

/** Require superadmin for all org admin routes */
const requireSuperAdmin = async (req) => {
	const initialData = await getInitialData(req);
	if (!initialData.loginData.isSuperAdmin) {
		throw new ForbiddenError();
	}
	return initialData;
};

/** Require superadmin OR an org member at any level, for read-only org routes */
const requireOrgMember = async (req, orgId: string) => {
	const initialData = await getInitialData(req);
	if (initialData.loginData.isSuperAdmin) {
		return initialData;
	}
	if (initialData.loginData.id && (await isUserOrgMember(initialData.loginData.id, orgId))) {
		return initialData;
	}
	throw new ForbiddenError();
};

/** Require superadmin OR an org admin, for routes that manage the org */
const requireOrgAdmin = async (req, orgId: string) => {
	const initialData = await getInitialData(req);
	if (initialData.loginData.isSuperAdmin) {
		return initialData;
	}
	if (initialData.loginData.id && (await isUserOrgAdmin(initialData.loginData.id, orgId))) {
		return initialData;
	}
	throw new ForbiddenError();
};

const isMemberPermission = (value: unknown): value is MemberPermission =>
	memberPermissions.includes(value as MemberPermission);

/** An org keeps at least one admin, unless a superadmin is the one changing it */
const assertNotLastAdmin = async (orgId: string, userId: string, isSuperAdmin: boolean) => {
	if (isSuperAdmin) return;
	const otherAdmins = await OrgMember.count({
		where: { orgId, permissions: 'admin' },
	});
	const isAdmin = await isUserOrgAdmin(userId, orgId);
	if (isAdmin && otherAdmins <= 1) {
		throw new BadRequestError(new Error('An org needs at least one admin'));
	}
};

// GET /api/orgs - list all orgs (superadmin)
router.get('/api/orgs', async (req, res, next) => {
	try {
		await requireSuperAdmin(req);
		const orgs = await getAllOrgsWithCommunityCounts();
		return res.status(200).json(orgs);
	} catch (err) {
		return next(err);
	}
});

// POST /api/orgs - create org (superadmin)
router.post('/api/orgs', async (req, res, next) => {
	try {
		await requireSuperAdmin(req);
		const {
			slug,
			title,
			kfOrgId,
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
		if (typeof kfOrgId !== 'string' || !kfOrgId.trim()) {
			throw new BadRequestError(new Error('kfOrgId (the KF Account) is required'));
		}
		const org = await createOrg({
			slug,
			title,
			kfOrgId: kfOrgId.trim(),
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
/* Brand Helper — superadmins and org admins                           */
/* ------------------------------------------------------------------ */

// GET /api/orgs/brand-helper?domain=mit.edu
router.get('/api/orgs/brand-helper', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			// Check if user is an admin of any org
			const userId = initialData.loginData.id;
			if (!userId) throw new ForbiddenError();
			const orgAdmin = await OrgMember.findOne({ where: { userId, permissions: 'admin' } });
			if (!orgAdmin) throw new ForbiddenError();
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

// GET /api/orgs/brand-helper/proxy-image?url=... — proxy remote images to avoid CORS
router.get('/api/orgs/brand-helper/proxy-image', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			const userId = initialData.loginData.id;
			if (!userId) throw new ForbiddenError();
			const orgAdmin = await OrgMember.findOne({ where: { userId, permissions: 'admin' } });
			if (!orgAdmin) throw new ForbiddenError();
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

// PUT /api/orgs/:id - update org (superadmin or org admin)
router.put('/api/orgs/:id', async (req, res, next) => {
	try {
		const initialData = await requireOrgAdmin(req, req.params.id);
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
		// The KF Account: staff can set any; an org admin only one they belong to
		const { kfOrgId } = req.body;
		if (typeof kfOrgId === 'string' && kfOrgId.trim()) {
			const nextKfOrgId = kfOrgId.trim();
			if (!initialData.loginData.isSuperAdmin) {
				const accounts = await fetchUserOrgs(initialData.loginData.id!);
				if (!accounts.some((account) => account.id === nextKfOrgId)) {
					throw new ForbiddenError(
						new Error('You can only move an org to a KF Account you belong to'),
					);
				}
			}
			values.kfOrgId = nextKfOrgId;
		}
		// Remove undefined keys so we don't null out fields
		Object.keys(values).forEach((k) => {
			if (values[k] === undefined) delete values[k];
		});
		const org = await updateOrg(req.params.id, values);
		if (!org) {
			throw new NotFoundError();
		}
		return res.status(200).json(org.toJSON());
	} catch (err) {
		return next(err);
	}
});

// GET /api/orgs/:id/kf-accounts — the org's KF Account, and the KF Accounts this user can
// move it to (superadmin or org admin)
router.get('/api/orgs/:id/kf-accounts', async (req, res, next) => {
	try {
		const initialData = await requireOrgAdmin(req, req.params.id);
		const org = await getOrgById(req.params.id);
		if (!org) {
			throw new NotFoundError();
		}
		const accounts = await fetchUserOrgs(initialData.loginData.id!);
		return res.status(200).json({
			current: org.kfOrgId,
			accounts: accounts.map(({ id, name, slug, type }) => ({ id, name, slug, type })),
		});
	} catch (err) {
		return next(err);
	}
});

// DELETE /api/orgs/:id - delete org (superadmin)
router.delete('/api/orgs/:id', async (req, res, next) => {
	try {
		await requireSuperAdmin(req);
		await destroyOrg(req.params.id);
		return res.status(200).json({ success: true });
	} catch (err) {
		return next(err);
	}
});

// GET /api/orgs/:id - get org by id (superadmin or org member)
router.get('/api/orgs/:id', async (req, res, next) => {
	try {
		await requireOrgMember(req, req.params.id);
		const org = await getOrgById(req.params.id);
		if (!org) {
			throw new NotFoundError();
		}
		return res.status(200).json(org.toJSON());
	} catch (err) {
		return next(err);
	}
});

/* ------------------------------------------------------------------ */
/* Owned communities                                                   */
/* ------------------------------------------------------------------ */

// GET /api/orgs/:id/communities - communities the org owns (superadmin or org member)
router.get('/api/orgs/:id/communities', async (req, res, next) => {
	try {
		await requireOrgMember(req, req.params.id);
		const communities = await getOrgCommunities(req.params.id);
		return res.status(200).json(communities);
	} catch (err) {
		return next(err);
	}
});

// POST /api/orgs/:id/communities - give a community to the org (superadmin, until invites exist)
// body: { communityId } or { subdomain }
router.post('/api/orgs/:id/communities', async (req, res, next) => {
	try {
		await requireSuperAdmin(req);
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
		if (!(await addCommunityToOrg(req.params.id, communityId))) {
			throw new NotFoundError();
		}
		return res.status(201).json({ success: true });
	} catch (err) {
		return next(err);
	}
});

// DELETE /api/orgs/:id/communities/:communityId - release a community from the org (org admin)
router.delete('/api/orgs/:id/communities/:communityId', async (req, res, next) => {
	try {
		await requireOrgAdmin(req, req.params.id);
		await removeCommunityFromOrg(req.params.id, req.params.communityId);
		return res.status(200).json({ success: true });
	} catch (err) {
		return next(err);
	}
});

// GET /api/orgs/slug/:slug/data?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// Fetch org data dashboard with optional time range for analytics
router.get('/api/orgs/slug/:slug/data', async (req, res, next) => {
	try {
		const { slug } = req.params;
		const org = await getOrgBySlug(slug);
		if (!org) throw new NotFoundError();
		const initialData = await requireOrgMember(req, org.id);

		// Inactive orgs: only superadmins can access the dashboard
		if (!org.isActive && !initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}

		const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
		const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;

		const orgData = await getOrgDataDashboard(slug, {
			startDate,
			endDate,
			userId: initialData.loginData.id,
			isSuperAdmin: initialData.loginData.isSuperAdmin,
		});
		if (!orgData) throw new NotFoundError();
		return res.status(200).json(orgData);
	} catch (err) {
		return next(err);
	}
});

/* ------------------------------------------------------------------ */
/* Org members                                                         */
/* ------------------------------------------------------------------ */

// GET /api/orgs/:id/members (superadmin or org member)
router.get('/api/orgs/:id/members', async (req, res, next) => {
	try {
		await requireOrgMember(req, req.params.id);
		const members = await getOrgMembers(req.params.id);
		return res.status(200).json(members);
	} catch (err) {
		return next(err);
	}
});

// POST /api/orgs/:id/members — body: { slug } (user slug) or { userId }, and permissions
// Adds the member, or changes the level of an existing one (superadmin or org admin)
router.post('/api/orgs/:id/members', async (req, res, next) => {
	try {
		const initialData = await requireOrgAdmin(req, req.params.id);
		let { userId } = req.body;
		const { slug, permissions = 'view' } = req.body;
		if (!isMemberPermission(permissions)) {
			return res.status(400).json({ error: `Unknown permission level "${permissions}"` });
		}
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
		if (permissions !== 'admin') {
			await assertNotLastAdmin(req.params.id, userId, initialData.loginData.isSuperAdmin);
		}
		const record = await addOrgMember(req.params.id, userId, permissions);
		return res.status(201).json(record);
	} catch (err) {
		return next(err);
	}
});

// DELETE /api/orgs/:id/members/:userId (superadmin or org admin)
router.delete('/api/orgs/:id/members/:userId', async (req, res, next) => {
	try {
		const initialData = await requireOrgAdmin(req, req.params.id);
		await assertNotLastAdmin(
			req.params.id,
			req.params.userId,
			initialData.loginData.isSuperAdmin,
		);
		await removeOrgMember(req.params.id, req.params.userId);
		return res.status(200).json({ success: true });
	} catch (err) {
		return next(err);
	}
});

/* ------------------------------------------------------------------ */
/* Suggested Communities — superadmin or org admin                     */
/* ------------------------------------------------------------------ */

// GET /api/orgs/:id/suggested-communities
router.get('/api/orgs/:id/suggested-communities', async (req, res, next) => {
	try {
		await requireOrgAdmin(req, req.params.id);
		const suggestions = await getSuggestedCommunities(req.params.id);
		return res.status(200).json(suggestions);
	} catch (err) {
		return next(err);
	}
});

/* ------------------------------------------------------------------ */
/* Featured Pubs — from communities the org owns                       */
/* ------------------------------------------------------------------ */

// GET /api/orgs/:id/pubs — list featured pubs for this org (superadmin or org member)
router.get('/api/orgs/:id/pubs', async (req, res, next) => {
	try {
		await requireOrgMember(req, req.params.id);
		const pubs = await getOrgFeaturedPubs(req.params.id);
		return res.status(200).json(pubs);
	} catch (err) {
		return next(err);
	}
});

// POST /api/orgs/:id/pubs — feature a pub from an owned community (superadmin or org admin)
// body: { pubId, rank?, showOnLandingPage? }
router.post('/api/orgs/:id/pubs', async (req, res, next) => {
	try {
		await requireOrgAdmin(req, req.params.id);
		const { pubId, rank, showOnLandingPage } = req.body;
		if (!pubId) {
			return res.status(400).json({ error: 'pubId is required' });
		}
		const pub = await Pub.findByPk(pubId, {
			attributes: ['id'],
			include: [{ model: Community, as: 'community', attributes: ['orgId'] }],
		});
		if (!pub) {
			return res.status(404).json({ error: 'Pub not found' });
		}
		if (pub.community?.orgId !== req.params.id) {
			return res
				.status(400)
				.json({ error: 'Only pubs from communities this org owns can be featured' });
		}
		const record = await addPubToOrg(req.params.id, pubId, { rank, showOnLandingPage });
		return res.status(201).json(record);
	} catch (err) {
		return next(err);
	}
});

// PUT /api/orgs/:id/pubs/:pubId — update rank or showOnLandingPage (superadmin or org admin)
router.put('/api/orgs/:id/pubs/:pubId', async (req, res, next) => {
	try {
		await requireOrgAdmin(req, req.params.id);
		const record = await OrgFeaturedPub.findOne({
			where: { orgId: req.params.id, pubId: req.params.pubId },
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
		if (Object.keys(updates).length > 0) {
			await record.update(updates);
		}
		return res.status(200).json(record.toJSON());
	} catch (err) {
		return next(err);
	}
});

// DELETE /api/orgs/:id/pubs/:pubId — stop featuring a pub (superadmin or org admin)
router.delete('/api/orgs/:id/pubs/:pubId', async (req, res, next) => {
	try {
		await requireOrgAdmin(req, req.params.id);
		await removePubFromOrg(req.params.id, req.params.pubId);
		return res.status(200).json({ success: true });
	} catch (err) {
		return next(err);
	}
});

// GET /api/orgs/:id/suggested-pubs — search the owned communities' pubs (superadmin or org admin)
router.get('/api/orgs/:id/suggested-pubs', async (req, res, next) => {
	try {
		await requireOrgAdmin(req, req.params.id);
		const limit = Math.min(parseInt(String(req.query.limit), 10) || 50, 200);
		const offset = Math.max(parseInt(String(req.query.offset), 10) || 0, 0);
		const result = await getSuggestedPubs(req.params.id, { limit, offset });
		return res.status(200).json(result);
	} catch (err) {
		return next(err);
	}
});
