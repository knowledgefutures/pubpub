import { Op } from 'sequelize';

import { Member, includeUserModel } from 'server/models';

import { buildOrQuery } from './scopeGet';

const membersQueryShared = {
	include: [
		// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ as: string; required: boolean;... Remove this comment to see the full error message
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
