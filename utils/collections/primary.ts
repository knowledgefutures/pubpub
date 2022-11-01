import { sortByRank } from 'utils/rank';
import { Collection, CollectionPub } from 'types';

const isPrimaryCollectionCandidate = (collectionPub: CollectionPub) => {
	const { collection } = collectionPub;
	return collection && collection.kind !== 'tag';
};

export const getPrimaryCollection = (collectionPubs: CollectionPub[]) => {
	const candidate = sortByRank(collectionPubs, 'pubRank').find(isPrimaryCollectionCandidate);
	if (candidate) {
		return candidate.collection as Collection;
	}
	return null;
};

export const getPrimaryCollectionPub = (collectionPubs: CollectionPub[]) =>
	sortByRank(collectionPubs, 'pubRank').find(isPrimaryCollectionCandidate);

export const sortByPrimaryStatus = (collectionPubs: CollectionPub[]) => {
	const sortedByRank = sortByRank(collectionPubs, 'pubRank');
	const primaryIndex = sortedByRank.findIndex(isPrimaryCollectionCandidate);
	if (primaryIndex !== -1) {
		const primary = sortedByRank[primaryIndex];
		const rest = sortedByRank.filter((cp) => cp !== primary);
		return [primary, ...rest];
	}
	return sortedByRank;
};
