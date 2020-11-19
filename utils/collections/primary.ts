import { sortByRank } from 'utils/rank';
import { Collection, CollectionPub } from 'utils/types';

export const getPrimaryCollection = (collectionPubs: CollectionPub[]) => {
	const matchingCollectionPub = sortByRank(collectionPubs, 'pubRank').find((collectionPub) => {
		const { collection } = collectionPub;
		return collection && collection.kind !== 'tag' && collection.isPublic;
	});

	if (matchingCollectionPub) {
		return matchingCollectionPub.collection as Collection;
	}

	return null;
};
