import type { MemberPermission } from 'types';

import { Op } from 'sequelize';

import {
	Community,
	Org,
	OrgFeaturedPub,
	OrgInvite,
	OrgMember,
	Pub,
	Release,
	SpamTag,
	User,
} from 'server/models';

export const getOrgBySlug = async (slug: string) => {
	return Org.findOne({ where: { slug } });
};

export const getOrgById = async (id: string) => {
	return Org.findByPk(id);
};

export const getOrgWithCommunities = async (slug: string) => {
	const org = await Org.findOne({ where: { slug } });
	if (!org) {
		return null;
	}
	const communities = (await getOwnedCommunities(org.id)).map((c) => c.toJSON());

	// Add pub counts (released pubs only)
	const communitiesWithCounts = await Promise.all(
		communities.map(async (c: any) => {
			const pubCount = await Pub.count({
				where: { communityId: c.id },
				include: [{ model: Release, attributes: [], required: true }],
			});
			return { ...c, pubCount };
		}),
	);

	return {
		...org.toJSON(),
		communities: communitiesWithCounts,
	};
};

export const getAllOrgsWithCommunityCounts = async () => {
	const orgs = await Org.findAll({ order: [['title', 'ASC']] });
	const result = await Promise.all(
		orgs.map(async (org) => {
			const communityCount = await Community.count({
				where: { orgId: org.id },
			});
			return { ...org.toJSON(), communityCount };
		}),
	);
	return result;
};

/** Fetches all orgs with community counts + total pub counts for the /orgs directory.
 *  Filters out private orgs. Inactive orgs still appear (inactive only hides the dashboard). */
export const getAllOrgsForDirectory = async () => {
	const orgs = await Org.findAll({
		where: { isPrivate: false },
		order: [['title', 'ASC']],
	});
	const result = await Promise.all(
		orgs.map(async (org) => {
			const communityIds = (await getOwnedCommunities(org.id, ['id'])).map((c) => c.id);
			const communityCount = communityIds.length;
			const pubCount =
				communityCount > 0
					? await Pub.count({
							where: { communityId: communityIds },
							include: [{ model: Release, attributes: [], required: true }],
						})
					: 0;
			return { ...org.toJSON(), communityCount, pubCount };
		}),
	);
	return result;
};

export const createOrg = async (values: {
	slug: string;
	title: string;
	kfOrgId: string;
	subtitle?: string | null;
	description?: string | null;
	avatar?: string | null;
	heroImage?: string | null;
	heroLogo?: string | null;
	accentColorLight?: string | null;
	accentColorDark?: string | null;
	website?: string | null;
	email?: string | null;
	communityCreationEnabled?: boolean;
	communityCloneAccess?: 'off' | 'everyone' | 'managers';
	isActive?: boolean;
	isPrivate?: boolean;
}) => {
	const org = await Org.create(values);
	return org.toJSON();
};

export const updateOrg = async (
	id: string,
	values: Partial<{
		slug: string;
		title: string;
		subtitle: string | null;
		description: string | null;
		avatar: string | null;
		heroImage: string | null;
		heroLogo: string | null;
		accentColorLight: string | null;
		accentColorDark: string | null;
		website: string | null;
		email: string | null;
		communityCreationEnabled: boolean;
		communityCloneAccess: 'off' | 'everyone' | 'managers';
		isActive: boolean;
		isPrivate: boolean;
		domains: string[];
		pubSearchTerms: string[];
		kfOrgId: string;
	}>,
) => {
	await Org.update(values, { where: { id } });
	return Org.findByPk(id);
};

export const destroyOrg = async (id: string) => {
	return Org.destroy({ where: { id } });
};

const ownedCommunityAttributes = [
	'id',
	'subdomain',
	'domain',
	'title',
	'description',
	'heroBackgroundImage',
	'heroLogo',
	'accentColorLight',
	'accentColorDark',
	'headerLogo',
	'headerColorType',
	'createdAt',
	'updatedAt',
];

/** Communities the org owns, minus confirmed spam */
export const getOwnedCommunities = async (
	orgId: string,
	attributes: string[] = ownedCommunityAttributes,
) => {
	const communities = await Community.findAll({
		where: { orgId },
		attributes,
		include: [{ model: SpamTag, as: 'spamTag', attributes: ['status'], required: false }],
		order: [['title', 'ASC']],
	});
	return communities.filter((c) => c.spamTag?.status !== 'confirmed-spam');
};

export const getOrgCommunities = async (orgId: string) => {
	const communities = await getOwnedCommunities(orgId);
	return communities.map((c) => {
		const { spamTag: _spamTag, ...community } = c.toJSON() as any;
		return community;
	});
};

/** Stops featuring a community's pubs in every org but the one that now owns it */
const unfeatureCommunityPubs = async (communityId: string, owningOrgId: string | null) => {
	const pubs = await Pub.findAll({ where: { communityId }, attributes: ['id'] });
	if (pubs.length === 0) {
		return;
	}
	await OrgFeaturedPub.destroy({
		where: {
			pubId: pubs.map((p) => p.id),
			...(owningOrgId ? { orgId: { [Op.ne]: owningOrgId } } : {}),
		},
	});
};

/**
 * Gives a community to an org, moving it if another org owns it. Closes every pending invite or
 * request for it, accepting the one from this org.
 */
export const moveCommunityToOrg = async (communityId: string, orgId: string, actorId: string) => {
	await Community.update({ orgId }, { where: { id: communityId } });
	await unfeatureCommunityPubs(communityId, orgId);
	const respondedAt = new Date();
	await OrgInvite.update(
		{ status: 'cancelled', respondedById: actorId, respondedAt },
		{ where: { communityId, status: 'pending', orgId: { [Op.ne]: orgId } } },
	);
	await OrgInvite.update(
		{ status: 'accepted', respondedById: actorId, respondedAt },
		{ where: { communityId, orgId, status: 'pending' } },
	);
};

/** Releases a community from the org that owns it */
export const removeCommunityFromOrg = async (orgId: string, communityId: string) => {
	const [count] = await Community.update({ orgId: null }, { where: { id: communityId, orgId } });
	if (count > 0) {
		await unfeatureCommunityPubs(communityId, null);
	}
	return count > 0;
};

/* ------------------------------------------------------------------ */
/* Org Members                                                         */
/* ------------------------------------------------------------------ */

export const getOrgMembers = async (orgId: string) => {
	const managers = await OrgMember.findAll({
		where: { orgId },
		include: [
			{
				model: User,
				attributes: ['id', 'fullName', 'slug', 'avatar', 'initials'],
			},
		],
	});
	return managers.map((m) => {
		const mj = m.toJSON() as any;
		return {
			id: mj.id,
			userId: mj.userId,
			orgId: mj.orgId,
			permissions: mj.permissions,
			user: mj.user || null,
		};
	});
};

export const addOrgMember = async (
	orgId: string,
	userId: string,
	permissions: MemberPermission = 'view',
) => {
	const [record, created] = await OrgMember.findOrCreate({
		where: { orgId, userId },
		defaults: { orgId, userId, permissions },
	});
	if (!created && record.permissions !== permissions) {
		await record.update({ permissions });
	}
	return record.toJSON();
};

export const removeOrgMember = async (orgId: string, userId: string) => {
	return OrgMember.destroy({ where: { orgId, userId } });
};

/** Check whether a user is a member of an org, at any level */
export const isUserOrgMember = async (userId: string, orgId: string): Promise<boolean> => {
	const count = await OrgMember.count({ where: { orgId, userId } });
	return count > 0;
};

/** Check whether a user is an admin of an org: admins manage the org itself */
export const isUserOrgAdmin = async (userId: string, orgId: string): Promise<boolean> => {
	const count = await OrgMember.count({ where: { orgId, userId, permissions: 'admin' } });
	return count > 0;
};
