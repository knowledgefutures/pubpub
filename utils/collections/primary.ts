import { sortByRank } from 'utils/rank';
import * as types from 'types';
import { CollectionPub } from 'server/models';

const isPrimaryCollectionCandidate = (collectionPub: types.CollectionPub | CollectionPub) => {
	const { collection } = collectionPub;
	return collection && collection.kind !== 'tag';
};

export const getPrimaryCollection = (collectionPubs: types.CollectionPub[] | CollectionPub[]) => {
	const candidate = sortByRank(
		collectionPubs as (typeof collectionPubs)[number][],
		'pubRank',
	).find(isPrimaryCollectionCandidate);
	if (candidate) {
		return candidate.collection as types.Collection;
	}
	return null;
};

export const getPrimaryCollectionPub = (collectionPubs: types.CollectionPub[] | CollectionPub[]) =>
	sortByRank(collectionPubs as (typeof collectionPubs)[number][], 'pubRank').find(
		isPrimaryCollectionCandidate,
	);

export const sortByPrimaryStatus = (collectionPubs: types.CollectionPub[]) => {
	const sortedByRank = sortByRank(collectionPubs, 'pubRank');
	const primaryIndex = sortedByRank.findIndex(isPrimaryCollectionCandidate);
	if (primaryIndex !== -1) {
		const primary = sortedByRank[primaryIndex];
		const rest = sortedByRank.filter((cp) => cp !== primary);
		return [primary, ...rest];
	}
	return sortedByRank;
};
