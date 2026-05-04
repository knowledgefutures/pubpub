import { Op } from 'sequelize';

import { Community, SpamTag, User } from 'server/models';

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

export const getSearchCommunities = async (searchString: string, limit = 8) => {
	if (searchString.length === 0) {
		return [];
	}
	const results = await Community.findAll({
		where: {
			[Op.or]: [
				{ title: { [Op.iLike]: `%${searchString}%` } },
				{ subdomain: { [Op.iLike]: `%${searchString}%` } },
				{ domain: { [Op.iLike]: `%${searchString}%` } },
			],
		},
		attributes: [
			'id',
			'title',
			'subdomain',
			'domain',
			'description',
			'heroLogo',
			'accentColorDark',
		],
		include: [
			{
				model: SpamTag,
				as: 'spamTag',
				attributes: ['status'],
				required: false,
			},
		],
		limit: limit + 5, // fetch extra to account for spam filtering
	});
	return results.filter((c: any) => c.spamTag?.status !== 'confirmed').slice(0, limit);
};

/**
 * Batch-search for multiple author names in a single query, returning a map
 * from each searched name to its matching users (up to `limit` per name).
 */
export const batchSearchUsers = async (names: string[], limit = 5) => {
	const nonEmpty = names.filter((n) => n.length > 0);
	if (nonEmpty.length === 0) {
		return new Map<string, any[]>();
	}

	const users = await User.findAll({
		where: {
			[Op.or]: nonEmpty.flatMap((name) => [
				{ fullName: { [Op.iLike]: `%${name}%` } },
				{ slug: { [Op.iLike]: `%${name}%` } },
				{ email: { [Op.iLike]: name } },
			]),
		},
		attributes: ['id', 'slug', 'fullName', 'initials', 'avatar'],
	});

	const resultMap = new Map<string, any[]>(nonEmpty.map((name) => [name, []]));
	const allUsers = users.map((u) => u.toJSON());

	for (const name of nonEmpty) {
		const lowerName = name.toLowerCase();
		const matches = allUsers
			.filter(
				(u: any) =>
					u.fullName?.toLowerCase().includes(lowerName) ||
					u.slug?.toLowerCase().includes(lowerName) ||
					u.email?.toLowerCase() === lowerName,
			)
			.slice(0, limit);
		resultMap.set(name, matches);
	}

	return resultMap;
};
