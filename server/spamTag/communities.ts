import { Op } from 'sequelize';

import * as types from 'types';
import { Community, SpamTag } from 'server/models';

const orderableFields = {
	'community-created-at': ['createdAt'],
	'spam-status-updated-at': [{ model: SpamTag, as: 'spamTag' }, 'statusUpdatedAt'],
	'spam-score': [{ model: SpamTag, as: 'spamTag' }, 'spamScore'],
} as const;

const getWhereQueryPartForUrl = (searchTerm: string) => {
	let url: URL;
	try {
		url = new URL(searchTerm);
	} catch (err: unknown) {
		return [];
	}
	if (url.hostname.endsWith('.pubpub.org')) {
		const subdomain = url.hostname.replace('.pubpub.org', '');
		return [{ subdomain }];
	}
	return [{ domain: url.hostname }];
};

const getWhereQueryPartForFreeformEntry = (searchTerm: string) => {
	const normalizedQuery = `%${searchTerm.trim()}%`;
	return {
		[Op.or]: [
			{ title: { [Op.iLike]: normalizedQuery } },
			{ subdomain: { [Op.iLike]: normalizedQuery } },
			{ domain: { [Op.iLike]: normalizedQuery } },
		],
	};
};

const getCommunityWhereQuery = (searchTerm: undefined | string) => {
	if (searchTerm) {
		return {
			where: {
				[Op.or]: [
					getWhereQueryPartForFreeformEntry(searchTerm),
					getWhereQueryPartForUrl(searchTerm),
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
const getQueryOrdering = (ordering: types.SpamCommunityQueryOrdering) => {
	const { field, direction } = ordering;
	return [[...orderableFields[field], direction]] as [OrderFields[number], 'ASC' | 'DESC'][];
};

export const queryCommunitiesForSpamManagement = (query: types.SpamCommunityQuery) => {
	const { limit, offset, ordering, status, searchTerm } = query;
	return Community.findAll({
		...getCommunityWhereQuery(searchTerm),
		attributes: ['id', 'title', 'subdomain', 'domain', 'description', 'createdAt'],
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
	}) as Promise<types.DefinitelyHas<Community, 'spamTag'>[]>;
};
