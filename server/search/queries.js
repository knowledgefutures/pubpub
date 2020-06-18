import { Op } from 'sequelize';

import { User } from 'server/models';

export const getSearchUsers = (searchString, limit = 5) => {
	return User.findAll({
		where: {
			[Op.or]: [
				{ fullName: { [Op.iLike]: `%${searchString}%` } },
				{ slug: { [Op.iLike]: `%${searchString}%` } },
			],
		},
		attributes: ['id', 'slug', 'fullName', 'initials', 'avatar'],
		limit: limit,
	});
};
