import { Op } from 'sequelize';

import { Community, Org, OrgInvite, OrgMember, User } from 'server/models';
import { isUserOrgAdmin } from 'server/org/queries';
import { getScope } from 'server/utils/queryHelpers';

type Actor = { id: string; isSuperAdmin: boolean };

export const canAdminOrg = async (actor: Actor, orgId: string) =>
	actor.isSuperAdmin || isUserOrgAdmin(actor.id, orgId);

/** Community admin, including an admin level inherited from the owning org */
export const canAdminCommunity = async (actor: Actor, communityId: string) => {
	const scope = await getScope({ communityId, loginId: actor.id });
	return scope.activePermissions.canAdminCommunity;
};

/** Moves a community into an org, closing every other pending invite or request for it */
export const moveCommunityToOrg = async (communityId: string, orgId: string, actor: Actor) => {
	await Community.update({ orgId }, { where: { id: communityId } });
	await OrgInvite.update(
		{ status: 'cancelled', respondedById: actor.id, respondedAt: new Date() },
		{ where: { communityId, status: 'pending', orgId: { [Op.ne]: orgId } } },
	);
	await OrgInvite.update(
		{ status: 'accepted', respondedById: actor.id, respondedAt: new Date() },
		{ where: { communityId, orgId, status: 'pending' } },
	);
};

/**
 * Opens an invite (org → community) or a request (community → org). If the other side already
 * asked, the two agree, so the community moves in.
 */
export const openOrgInvite = async (
	orgId: string,
	communityId: string,
	direction: 'invite' | 'request',
	actor: Actor,
) => {
	const pending = await OrgInvite.findOne({ where: { orgId, communityId, status: 'pending' } });
	if (pending && pending.direction !== direction) {
		await moveCommunityToOrg(communityId, orgId, actor);
		return { status: 'joined' as const };
	}
	if (pending) {
		return { status: 'pending' as const, invite: pending.toJSON() };
	}
	const invite = await OrgInvite.create({
		orgId,
		communityId,
		direction,
		requestedById: actor.id,
	});
	return { status: 'pending' as const, invite: invite.toJSON() };
};

export const closeOrgInvite = async (
	invite: OrgInvite,
	status: 'declined' | 'cancelled',
	actor: Actor,
) => {
	await invite.update({ status, respondedById: actor.id, respondedAt: new Date() });
	return invite.toJSON();
};

const userAttributes = ['id', 'fullName', 'slug', 'avatar', 'initials'];

export const getPendingInvitesForCommunity = async (communityId: string) => {
	const invites = await OrgInvite.findAll({
		where: { communityId, status: 'pending' },
		include: [
			{ model: Org, attributes: ['id', 'slug', 'title', 'avatar'] },
			{ model: User, as: 'requestedBy', attributes: userAttributes },
		],
		order: [['createdAt', 'DESC']],
	});
	return invites.map((i) => i.toJSON());
};

export const getPendingInvitesForOrg = async (orgId: string) => {
	const invites = await OrgInvite.findAll({
		where: { orgId, status: 'pending' },
		include: [
			{
				model: Community,
				attributes: ['id', 'subdomain', 'domain', 'title', 'avatar', 'orgId'],
			},
			{ model: User, as: 'requestedBy', attributes: userAttributes },
		],
		order: [['createdAt', 'DESC']],
	});
	return invites.map((i) => i.toJSON());
};

/** Orgs the user can move a community into without asking: those they admin */
export const getOrgsUserAdmins = async (actor: Actor) => {
	const attributes = ['id', 'slug', 'title', 'avatar'];
	if (actor.isSuperAdmin) {
		return Org.findAll({ attributes, order: [['title', 'ASC']] });
	}
	const adminships = await OrgMember.findAll({
		where: { userId: actor.id, permissions: 'admin' },
		attributes: ['orgId'],
	});
	if (adminships.length === 0) {
		return [];
	}
	return Org.findAll({
		where: { id: adminships.map((m) => m.orgId) },
		attributes,
		order: [['title', 'ASC']],
	});
};
