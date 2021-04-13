import { Collection } from 'server/models';
import { getManyPubs } from 'server/pub/queryMany';
import { Collection as CollectionType, InitialData } from 'utils/types';

import sanitizeCollection from './collectionSanitize';
import { SanitizedPubData } from './pubSanitize';

type Options = {
	loadPubs?: number;
};

const getCollections = async (initialData: InitialData): Promise<CollectionType> => {
	const { communityData } = initialData;
	const collections = await Collection.findAll({
		where: { communityId: communityData.id },
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

export const getCommunityOverview = async (initialData: InitialData, options: Options = {}) => {
	const { loadPubs = 200 } = options;
	const [pubs, collections] = await Promise.all([
		getPubs(initialData, loadPubs),
		getCollections(initialData),
	]);
	return {
		pubs,
		collections,
		includesAllPubs: pubs.length < loadPubs,
	};
};
