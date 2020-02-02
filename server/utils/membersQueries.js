import { Op } from 'sequelize';
import { User, Member } from '../models';
import { attributesPublicUser } from '.';
import { buildOrQuery } from './scopeData';

export const getMembersData = (initialData) => {
	const orQuery = buildOrQuery(initialData.scopeData);

	return Member.findAll({
		where: {
			[Op.or]: orQuery,
		},
		include: [
			{
				model: User,
				as: 'user',
				required: false,
				attributes: attributesPublicUser,
			},
		],
	}).then((members) => {
		return { members: members.map((mb) => mb.toJSON()), invitations: [] };
	});
};
