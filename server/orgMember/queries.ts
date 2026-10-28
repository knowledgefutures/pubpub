import type { ScopeMember } from 'types';

import { Community, Org, OrgMember } from 'server/models';

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
