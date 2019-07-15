import { Op } from 'sequelize';
import { User } from '../models';

export const getSearchUsers = (inputValues) => {
	return User.findAll({
		where: {
			[Op.or]: [
				{ fullName: { [Op.iLike]: `%${inputValues.q}%` } },
				{ slug: { [Op.iLike]: `%${inputValues.q}%` } },
			],
		},
		attributes: ['id', 'slug', 'fullName', 'initials', 'avatar'],
		limit: 5,
	});
};
