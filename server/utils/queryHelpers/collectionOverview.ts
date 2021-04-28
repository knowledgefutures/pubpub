import { Collection, CollectionPub, ScopeSummary } from 'server/models';
import { getManyPubs } from 'server/pub/queryMany';
import { InitialData } from 'utils/types';

type Options = {
	loadPubs?: number;
};

const getCollection = async (collectionId: string) => {
	const collection = await Collection.findOne({
		where: { id: collectionId },
		include: [{ model: ScopeSummary, as: 'scopeSummary' }],
	});
	return collection.toJSON();
};

const getCollectionPubs = async (collectionId: string) => {
	const collectionPubs = await CollectionPub.findAll({ where: { collectionId } });
	return collectionPubs.map((cp) => cp.toJSON());
};

const getPubs = async (initialData: InitialData, collectionId: string, limit: number) => {
	const { communityData } = initialData;
	const result = await getManyPubs({
		query: {
			limit,
			communityId: communityData.id,
			scopedCollectionId: collectionId,
			ordering: { field: 'collectionRank', direction: 'ASC' },
		},
		options: {
			getCollections: true,
		},
	});
	return result.sanitize(initialData);
};

export const getCollectionOverview = async (initialData: InitialData, options: Options = {}) => {
	const { loadPubs = 200 } = options;
	const { activeCollection } = initialData.scopeData.elements;
	const collectionId = activeCollection!.id;

	const [collection, collectionPubs, pubs] = await Promise.all([
		getCollection(collectionId),
		getCollectionPubs(collectionId),
		getPubs(initialData, collectionId, loadPubs),
	]);

	return { collection, pubs, collectionPubs, includesAllPubs: pubs.length < loadPubs };
};
