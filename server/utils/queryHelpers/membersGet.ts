import type { ScopeData } from 'types';

import { Op } from 'sequelize';

import { Community, includeUserModel, Member, Org, OrgMember } from 'server/models';

import { buildOrQuery } from './scopeGet';

const membersQueryShared = {
	include: [
		includeUserModel({
			as: 'user',
			required: false,
		}),
	],
};

export const getMemberDataById = (memberId: string, includeShared = true) => {
	return Member.findOne({ where: { id: memberId }, ...(includeShared && membersQueryShared) });
};

export default async (initialData: { scopeData: ScopeData }) => {
	const orQuery = buildOrQuery(initialData.scopeData.elements);

	const members = await Member.findAll({
		where: {
			[Op.or]: orQuery,
		},
		...membersQueryShared,
	});
	const { orgMembers, org } = await getInheritedOrgMembers(
		initialData.scopeData.elements.activeCommunity.id,
	);
	return { members: members.map((mb) => mb.toJSON()), invitations: [], orgMembers, org };
};

/** Members of the org that owns the community, who inherit their level in it */
const getInheritedOrgMembers = async (communityId: string) => {
	const community = await Community.findByPk(communityId, {
		attributes: ['orgId'],
		include: [{ model: Org, as: 'org', attributes: ['id', 'slug', 'title'] }],
	});
	if (!community?.org) {
		return { orgMembers: [], org: null };
	}
	const orgMembers = await OrgMember.findAll({
		where: { orgId: community.org.id },
		...membersQueryShared,
	});
	return {
		orgMembers: orgMembers.map((m) => ({ ...m.toJSON(), communityId })),
		org: community.org.toJSON(),
	};
};
