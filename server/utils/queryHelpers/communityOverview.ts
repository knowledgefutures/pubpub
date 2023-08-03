import { Collection, ScopeSummary } from 'server/models';
import { getManyPubs } from 'server/pub/queryMany';
import { getUserScopeVisits } from 'server/userScopeVisit/queries';
import { Collection as CollectionType, InitialData, SanitizedPubData } from 'types';

import sanitizeCollection from './collectionSanitize';

type Options = {
	loadPubs?: number;
};

const getCollections = async (initialData: InitialData): Promise<CollectionType> => {
	const { communityData } = initialData;
	const collections = await Collection.findAll({
		where: { communityId: communityData.id },
		include: [{ model: ScopeSummary, as: 'scopeSummary' }],
		order: [['title', 'ASC']],
	});
	return collections
		.map((collection) => sanitizeCollection(collection, initialData))
		.filter((x) => x);
};

const getPubs = async (initialData: InitialData, limit: number): Promise<SanitizedPubData[]> => {
	const { communityData } = initialData;
	const result = await getManyPubs({
		query: {
			communityId: communityData.id,
			limit,
			ordering: { field: 'title', direction: 'ASC' },
		},
	});
	return result.sanitize(initialData);
};

const getRecentItems = async (initialData: InitialData) => {
	const {
		loginData: { id: userId },
		communityData: { id: communityId },
	} = initialData;
	const userScopeVisits = await getUserScopeVisits({ userId, communityId });
	const result = await getManyPubs({
		query: {
			withinPubIds: userScopeVisits.map(({ pubId }) => pubId).filter((x) => x),
			communityId,
		},
	});
	const recentPubs = await result.sanitize(initialData);
	return {
		userScopeVisits,
		recentPubs,
	};
};

export const getCommunityOverview = async (initialData: InitialData, options: Options = {}) => {
	const { loadPubs = 200 } = options;
	const [pubs, collections, recentItems] = await Promise.all([
		getPubs(initialData, loadPubs),
		getCollections(initialData),
		getRecentItems(initialData),
	]);
	return {
		pubs,
		collections,
		...recentItems,
		includesAllPubs: pubs.length < loadPubs,
	};
};
