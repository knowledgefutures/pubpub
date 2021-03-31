import { Pub } from 'utils/types';

import { QueryState, ManyPubsQuery } from './types';
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
	query: ManyPubsQuery,
	newPubsById: Record<string, Pub>,
	hasLoadedAllPubs: boolean,
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
