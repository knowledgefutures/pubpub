import { Op } from 'sequelize';

import { User } from 'server/models';

export const getSearchUsers = async (searchString: string, limit = 5) => {
	if (searchString.length === 0) {
		return [];
	}
	return User.findAll({
		where: {
			[Op.or]: [
				{ fullName: { [Op.iLike]: `%${searchString}%` } },
				{ slug: { [Op.iLike]: `%${searchString}%` } },
				{ email: { [Op.iLike]: searchString } },
			],
		},
		attributes: ['id', 'slug', 'fullName', 'initials', 'avatar'],
		limit,
	});
};
