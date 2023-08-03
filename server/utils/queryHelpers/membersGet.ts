import { Op } from 'sequelize';

import { Member, includeUserModel } from 'server/models';

import { buildOrQuery } from './scopeGet';

const membersQueryShared = {
	include: [
		includeUserModel({
			as: 'user',
			required: false,
		}),
	],
};

export const getMemberDataById = (memberId, includeShared = true) => {
	return Member.findOne({ where: { id: memberId }, ...(includeShared && membersQueryShared) });
};

export default (initialData) => {
	const orQuery = buildOrQuery(initialData.scopeData.elements);

	return Member.findAll({
		where: {
			[Op.or]: orQuery,
		},
		...membersQueryShared,
	}).then((members) => {
		return { members: members.map((mb) => mb.toJSON()), invitations: [] };
	});
};
