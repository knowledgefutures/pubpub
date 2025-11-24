import { QueryTypes } from 'sequelize';

import { sequelize } from 'server/models';
import { createPurgeHooks } from 'utils/caching/createPurgeHooks';
import { getCorrectHostname } from 'utils/caching/getCorrectHostname';
import { getPPLic } from 'utils/caching/getHashedUserId';
import { uniqueCommunitiesFromMembersQuery } from 'utils/caching/uniqueCommunitiesFromMembersQuery';

import { User } from './model';

const getUniqueHostnamesForUserId = async (userId: string) => {
	const result = (await sequelize.query(uniqueCommunitiesFromMembersQuery, {
		replacements: { userId },
		type: QueryTypes.SELECT,
	})) as { domain: string | null; subdomain: string }[];

	const hostnames = result.map(({ domain, subdomain }) => getCorrectHostname(subdomain, domain));

	return hostnames;
};

createPurgeHooks({
	model: User,
	onModelUpdated: async (user) => {
		const hostnames = await getUniqueHostnamesForUserId(user.id);

		const allPurges = [
			// all the communities the user is a member of,
			// either directly or through a pub/collection
			// plus all the collection/pubs the user is attributed to
			...hostnames,
			// purge the cache for the logged in user
			getPPLic(user),
			// purge all the /user pages
			user.slug,
		];

		return allPurges;
	},
});
