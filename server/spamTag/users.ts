import type * as types from 'types';

import { Op } from 'sequelize';

import { SpamTag, User } from 'server/models';

const orderableFields = {
	'user-created-at': ['createdAt'],
	'spam-status-updated-at': [{ model: SpamTag, as: 'spamTag' }, 'statusUpdatedAt'],
	'spam-score': [{ model: SpamTag, as: 'spamTag' }, 'spamScore'],
} as const;

const getUserWhereQuery = (searchTerm?: string | null) => {
	console.log('searchTerm', searchTerm);
	if (searchTerm) {
		const normalizedQuery = `%${searchTerm.trim()}%`;
		return {
			where: {
				[Op.or]: [
					{ fullName: { [Op.iLike]: normalizedQuery } },
					{ email: { [Op.iLike]: normalizedQuery } },
					{ slug: { [Op.iLike]: normalizedQuery } },
				],
			},
		};
	}
	return {};
};

const getSpamTagStatusWhereQuery = (status: undefined | types.SpamStatus[]) => {
	if (status) {
		return { where: { status: { [Op.in]: status } } };
	}
	return {};
};

type OrderFields = (typeof orderableFields)[keyof typeof orderableFields];
const getQueryOrdering = (ordering: types.SpamUserQueryOrdering) => {
	const { field, direction } = ordering;
	return [[...orderableFields[field], direction]] as [OrderFields[number], 'ASC' | 'DESC'][];
};

export const queryUsersForSpamManagement = (query: types.SpamUserQuery) => {
	const { limit, offset, ordering, status, searchTerm } = query;
	return User.findAll({
		...getUserWhereQuery(searchTerm),
		attributes: ['id', 'fullName', 'email', 'slug', 'createdAt'],
		limit,
		offset,
		order: getQueryOrdering(ordering),
		include: [
			{
				model: SpamTag,
				as: 'spamTag',
				required: true,
				...getSpamTagStatusWhereQuery(status),
			},
		],
	}) as Promise<types.DefinitelyHas<User, 'spamTag'>[]>;
};
