import { Op } from 'sequelize';

import { Member, includeUserModel } from 'server/models';

import { ScopeData } from 'types';
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
	return { members: members.map((mb) => mb.toJSON()), invitations: [] };
};
