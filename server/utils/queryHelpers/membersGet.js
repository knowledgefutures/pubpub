import { Op } from 'sequelize';
import { User, Member } from '../../models';
import { attributesPublicUser } from '..';
import { buildOrQuery } from './scopeGet';

const membersQueryShared = {
	include: [
		{
			model: User,
			as: 'user',
			required: false,
			attributes: attributesPublicUser,
		},
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
