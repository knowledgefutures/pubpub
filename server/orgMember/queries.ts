import type { MemberPermission, ScopeMember } from 'types';

import { Community, Org, OrgMember, User } from 'server/models';

/** The user's membership in an org, with the org's id, slug and title */
export const getOrgMembership = async (userId: string, orgId: string) => {
	return OrgMember.findOne({
		where: { orgId, userId },
		include: [{ model: Org, attributes: ['id', 'slug', 'title'] }],
	});
};

/**
 * An org member gets their org-level permission in every community the org owns. This turns
 * that membership into a community-level member, tagged with the org it comes from, so code
 * that reads members takes it into account like any other row.
 */
export const getInheritedCommunityMember = async (
	userId: string,
	community: { id: string; orgId?: string | null },
): Promise<ScopeMember | null> => {
	const orgId =
		community.orgId === undefined
			? (await Community.findByPk(community.id, { attributes: ['orgId'] }))?.orgId
			: community.orgId;
	if (!orgId) {
		return null;
	}
	const membership = await getOrgMembership(userId, orgId);
	if (!membership?.org) {
		return null;
	}
	return {
		id: membership.id,
		userId,
		communityId: community.id,
		collectionId: null,
		pubId: null,
		permissions: membership.permissions,
		isOwner: false,
		subscribedToActivityDigest: false,
		createdAt: membership.createdAt.toISOString(),
		updatedAt: membership.updatedAt.toISOString(),
		inheritedFromOrg: {
			id: membership.org.id,
			slug: membership.org.slug,
			title: membership.org.title,
		},
	} as ScopeMember;
};

/** Ids of the communities owned by orgs the user belongs to, optionally only at these levels */
export const getCommunityIdsFromOrgMemberships = async (
	userId: string,
	permissions?: MemberPermission[],
) => {
	const memberships = await OrgMember.findAll({
		where: { userId, ...(permissions ? { permissions } : {}) },
		attributes: ['orgId'],
	});
	if (memberships.length === 0) {
		return [];
	}
	const communities = await Community.findAll({
		where: { orgId: memberships.map((m) => m.orgId) },
		attributes: ['id'],
	});
	return communities.map((c) => c.id);
};

/** Whether the user is an admin of the org that owns the community */
export const isInheritedCommunityAdmin = async (
	userId: string,
	community: { id: string; orgId?: string | null },
) => {
	const member = await getInheritedCommunityMember(userId, community);
	return member?.permissions === 'admin';
};

/** The admins of the org that owns the community, with their email and name */
export const getInheritedCommunityAdmins = async (communityId: string) => {
	const community = await Community.findByPk(communityId, { attributes: ['orgId'] });
	if (!community?.orgId) {
		return [];
	}
	return OrgMember.findAll({
		where: { orgId: community.orgId, permissions: 'admin' },
		include: [{ model: User, attributes: ['email', 'fullName'] }],
	});
};
