import { Router } from 'express';

import { Community, Org, OrgInvite } from 'server/models';
import { BadRequestError, ForbiddenError, NotFoundError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';

import {
	canAdminCommunity,
	canAdminOrg,
	closeOrgInvite,
	getOrgsUserAdmins,
	getPendingInvitesForCommunity,
	getPendingInvitesForOrg,
	moveCommunityToOrg,
	openOrgInvite,
} from './queries';

export const router = Router();

const getActor = async (req) => {
	const { loginData } = await getInitialData(req);
	if (!loginData.id) {
		throw new ForbiddenError();
	}
	return { id: loginData.id, isSuperAdmin: !!loginData.isSuperAdmin };
};

const findCommunity = async (communityId: string) => {
	const community = await Community.findByPk(communityId, { attributes: ['id', 'orgId'] });
	if (!community) {
		throw new NotFoundError();
	}
	return community;
};

const findOrg = async ({ orgId, orgSlug }: { orgId?: string; orgSlug?: string }) => {
	const org = orgId
		? await Org.findByPk(orgId)
		: orgSlug
			? await Org.findOne({ where: { slug: String(orgSlug).toLowerCase() } })
			: null;
	if (!org) {
		throw new NotFoundError(new Error('Org not found'));
	}
	return org;
};

/* ------------------------------------------------------------------ */
/* Community side — the Organization panel in community settings       */
/* ------------------------------------------------------------------ */

// GET /api/communities/:communityId/organization — owning org, pending invites and requests,
// and the orgs this user could move the community into (community admin)
router.get('/api/communities/:communityId/organization', async (req, res, next) => {
	try {
		const actor = await getActor(req);
		const { communityId } = req.params;
		if (!(await canAdminCommunity(actor, communityId))) {
			throw new ForbiddenError();
		}
		const community = await findCommunity(communityId);
		const [org, pending, adminOrgs] = await Promise.all([
			community.orgId
				? Org.findByPk(community.orgId, { attributes: ['id', 'slug', 'title', 'avatar'] })
				: null,
			getPendingInvitesForCommunity(communityId),
			getOrgsUserAdmins(actor),
		]);
		return res.status(200).json({
			org: org?.toJSON() ?? null,
			canLeave: !!org && (await canAdminOrg(actor, org.id)),
			invites: pending.filter((i) => i.direction === 'invite'),
			requests: pending.filter((i) => i.direction === 'request'),
			adminOrgs: adminOrgs.map((o) => o.toJSON()),
		});
	} catch (err) {
		return next(err);
	}
});

// POST /api/communities/:communityId/organization — body: { orgId } or { orgSlug }
// Admin of both moves the community in (or switches it, if also admin of its current org);
// otherwise this asks the org to take it (community admin)
router.post('/api/communities/:communityId/organization', async (req, res, next) => {
	try {
		const actor = await getActor(req);
		const { communityId } = req.params;
		if (!(await canAdminCommunity(actor, communityId))) {
			throw new ForbiddenError();
		}
		const community = await findCommunity(communityId);
		const org = await findOrg(req.body);
		if (community.orgId === org.id) {
			throw new BadRequestError(new Error('The community already belongs to this org'));
		}
		const mayLeaveCurrentOrg = !community.orgId || (await canAdminOrg(actor, community.orgId));
		if (!mayLeaveCurrentOrg) {
			throw new BadRequestError(
				new Error('Only an admin of the org that owns this community can move it'),
			);
		}
		if (await canAdminOrg(actor, org.id)) {
			await moveCommunityToOrg(communityId, org.id, actor);
			return res.status(200).json({ status: 'joined' });
		}
		const result = await openOrgInvite(org.id, communityId, 'request', actor);
		return res.status(result.status === 'joined' ? 200 : 201).json(result);
	} catch (err) {
		return next(err);
	}
});

// DELETE /api/communities/:communityId/organization — release the community from its org
// (admin of the owning org)
router.delete('/api/communities/:communityId/organization', async (req, res, next) => {
	try {
		const actor = await getActor(req);
		const community = await findCommunity(req.params.communityId);
		if (!community.orgId) {
			throw new BadRequestError(new Error('The community does not belong to an org'));
		}
		if (!(await canAdminOrg(actor, community.orgId))) {
			throw new ForbiddenError();
		}
		await community.update({ orgId: null });
		return res.status(200).json({ success: true });
	} catch (err) {
		return next(err);
	}
});

/* ------------------------------------------------------------------ */
/* Org side                                                            */
/* ------------------------------------------------------------------ */

// GET /api/orgs/:id/invites — pending invites and requests (org admin)
router.get('/api/orgs/:id/invites', async (req, res, next) => {
	try {
		const actor = await getActor(req);
		if (!(await canAdminOrg(actor, req.params.id))) {
			throw new ForbiddenError();
		}
		const pending = await getPendingInvitesForOrg(req.params.id);
		return res.status(200).json({
			invites: pending.filter((i) => i.direction === 'invite'),
			requests: pending.filter((i) => i.direction === 'request'),
		});
	} catch (err) {
		return next(err);
	}
});

// POST /api/orgs/:id/invites — body: { communityId } or { subdomain }
// Invites a community that has no org. An admin of the community too moves it in directly.
router.post('/api/orgs/:id/invites', async (req, res, next) => {
	try {
		const actor = await getActor(req);
		const orgId = req.params.id;
		if (!(await canAdminOrg(actor, orgId))) {
			throw new ForbiddenError();
		}
		const { communityId, subdomain } = req.body;
		const community = communityId
			? await Community.findByPk(communityId, { attributes: ['id', 'orgId'] })
			: subdomain
				? await Community.findOne({
						where: { subdomain: String(subdomain).toLowerCase() },
						attributes: ['id', 'orgId'],
					})
				: null;
		if (!community) {
			throw new NotFoundError(new Error('Community not found'));
		}
		if (community.orgId === orgId) {
			throw new BadRequestError(new Error('This org already owns the community'));
		}
		if (community.orgId) {
			throw new BadRequestError(new Error('Another org owns this community'));
		}
		if (await canAdminCommunity(actor, community.id)) {
			await moveCommunityToOrg(community.id, orgId, actor);
			return res.status(200).json({ status: 'joined' });
		}
		const result = await openOrgInvite(orgId, community.id, 'invite', actor);
		return res.status(result.status === 'joined' ? 200 : 201).json(result);
	} catch (err) {
		return next(err);
	}
});

/* ------------------------------------------------------------------ */
/* Answering                                                           */
/* ------------------------------------------------------------------ */

const findPendingInvite = async (id: string) => {
	const invite = await OrgInvite.findByPk(id);
	if (!invite) {
		throw new NotFoundError();
	}
	if (invite.status !== 'pending') {
		throw new BadRequestError(new Error(`This invite was already ${invite.status}`));
	}
	return invite;
};

/** The side that answers: the community for an invite, the org for a request */
const canAnswer = (actor, invite: OrgInvite) =>
	invite.direction === 'invite'
		? canAdminCommunity(actor, invite.communityId)
		: canAdminOrg(actor, invite.orgId);

/** The side that asked */
const canWithdraw = (actor, invite: OrgInvite) =>
	invite.direction === 'invite'
		? canAdminOrg(actor, invite.orgId)
		: canAdminCommunity(actor, invite.communityId);

// POST /api/orgInvites/:id/accept
router.post('/api/orgInvites/:id/accept', async (req, res, next) => {
	try {
		const actor = await getActor(req);
		const invite = await findPendingInvite(req.params.id);
		if (!(await canAnswer(actor, invite))) {
			throw new ForbiddenError();
		}
		const community = await findCommunity(invite.communityId);
		if (community.orgId && invite.direction === 'invite') {
			throw new BadRequestError(new Error('The community already belongs to an org'));
		}
		await moveCommunityToOrg(invite.communityId, invite.orgId, actor);
		return res.status(200).json({ status: 'joined' });
	} catch (err) {
		return next(err);
	}
});

// POST /api/orgInvites/:id/decline
router.post('/api/orgInvites/:id/decline', async (req, res, next) => {
	try {
		const actor = await getActor(req);
		const invite = await findPendingInvite(req.params.id);
		if (!(await canAnswer(actor, invite))) {
			throw new ForbiddenError();
		}
		return res.status(200).json(await closeOrgInvite(invite, 'declined', actor));
	} catch (err) {
		return next(err);
	}
});

// POST /api/orgInvites/:id/cancel
router.post('/api/orgInvites/:id/cancel', async (req, res, next) => {
	try {
		const actor = await getActor(req);
		const invite = await findPendingInvite(req.params.id);
		if (!(await canWithdraw(actor, invite))) {
			throw new ForbiddenError();
		}
		return res.status(200).json(await closeOrgInvite(invite, 'cancelled', actor));
	} catch (err) {
		return next(err);
	}
});
