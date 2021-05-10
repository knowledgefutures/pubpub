import { Pub } from 'types';

import { QueryState, KeyedPubsQuery } from './types';
import { getOrderingValuesByPubId, getPubsInOrder } from './ordering';

export const initialQueryState: QueryState = {
	hasLoadedAllPubs: false,
	isLoading: false,
	offset: 0,
	orderedPubs: {
		pubsInOrder: [],
		pubsById: {},
		orderingValuesByPubId: {},
	},
};

export const getStartLoadingPubsState = (state: QueryState, batchSize: number): QueryState => {
	return {
		...state,
		isLoading: true,
		offset: state.offset + batchSize,
	};
};

export const getFinishedLoadingPubsState = (
	state: QueryState,
	query: KeyedPubsQuery,
	newPubsById: Record<string, Pub>,
	hasLoadedAllPubs: boolean = false,
): QueryState => {
	const { orderedPubs } = state;
	const { ordering, scopedCollectionId } = query;
	const { pubsById = {}, orderingValuesByPubId = {} } = orderedPubs || {};
	const newOrderingBalues = getOrderingValuesByPubId(newPubsById, ordering, scopedCollectionId);
	const nextPubsById = { ...pubsById, ...newPubsById };
	const nextOrderingValuesByPubId = {
		...orderingValuesByPubId,
		...newOrderingBalues,
	};
	return {
		...state,
		isLoading: false,
		hasLoadedAllPubs,
		orderedPubs: {
			orderingValuesByPubId: nextOrderingValuesByPubId,
			pubsById: nextPubsById,
			pubsInOrder: getPubsInOrder(nextPubsById, nextOrderingValuesByPubId, ordering),
		},
	};
};

export const getInitialPubsState = (
	initialQuery: KeyedPubsQuery,
	initialPubs: Record<string, Pub>,
	initiallyLoadedAllPubs: boolean,
) => {
	return getFinishedLoadingPubsState(
		{
			...initialQueryState,
			offset: Object.keys(initialPubs).length,
		},
		initialQuery,
		initialPubs,
		initiallyLoadedAllPubs,
	);
};
