import { Pub, PubsQueryOrderingField, PubsQueryOrdering } from 'types';
import { getPubPublishedDate } from 'utils/pub/pubDates';

import { OrderingValue, OrderByFn } from './types';

const valueOrderedBelowAnyDate = 'a'; // Since any date starts with a number

const orderingFunctions: Record<PubsQueryOrderingField, OrderByFn> = {
	collectionRank: (pub, scopedCollectionId) => {
		if (scopedCollectionId) {
			const collectionPub = pub.collectionPubs?.find((cp) => cp.id === scopedCollectionId);
			if (collectionPub) {
				return collectionPub.rank;
			}
		}
		return '';
	},
	creationDate: (pub) => pub.createdAt,
	publishDate: (pub) => getPubPublishedDate(pub)?.toString() || valueOrderedBelowAnyDate,
	updatedDate: (pub) => {
		const dates = [pub.draft?.latestKeyAt, pub.updatedAt].filter((x): x is string => !!x);
		return dates.reduce(
			(latest, next) => (latest > next ? latest : next),
			valueOrderedBelowAnyDate,
		);
	},
	title: (pub) => pub.title.toLowerCase(),
};

export const getOrderingValuesByPubId = (
	pubsById: Record<string, Pub>,
	ordering: PubsQueryOrdering,
	scopedCollectionId?: string,
) => {
	const orderingValues: Record<string, OrderingValue> = {};
	const orderingFunction = orderingFunctions[ordering.field];
	Object.entries(pubsById).forEach(([id, pub]) => {
		orderingValues[id] = orderingFunction(pub, scopedCollectionId);
	});
	return orderingValues;
};

export const getPubsInOrder = (
	pubsById: Record<string, Pub>,
	orderingValuesByPubId: Record<string, OrderingValue>,
	ordering: PubsQueryOrdering,
) => {
	const sortedPubs = Object.values(pubsById).sort((a, b) =>
		orderingValuesByPubId[a.id] > orderingValuesByPubId[b.id] ? 1 : -1,
	);
	if (ordering.direction === 'DESC') {
		sortedPubs.reverse();
	}
	return sortedPubs;
};
