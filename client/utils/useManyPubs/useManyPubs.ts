import { useCallback, useEffect, useState } from 'react';

import { Pub } from 'utils/types';
import { usePageContext } from 'utils/hooks';
import { indexByProperty } from 'utils/arrays';
import { apiFetch } from 'client/utils/apiFetch';

import {
	getStartLoadingPubsState,
	getFinishedLoadingPubsState,
	initialQueryState,
	getInitialPubsState,
} from './state';
import {
	KeyedPubsQuery,
	ManyPubsState,
	ManyPubsQuery,
	ManyPubsApiResult,
	ManyPubsOptions,
	QueryState,
	ManyPubsReturnValues,
} from './types';

const defaultOrdering = { field: 'creationDate', direction: 'DESC' } as const;

const getQueryKey = (query: KeyedPubsQuery) => {
	const {
		term = '',
		scopedCollectionId = '',
		ordering: { field, direction },
	} = query;
	return JSON.stringify({ term, scopedCollectionId, field, direction });
};

export const useManyPubs = <P extends Pub = Pub>(
	options: ManyPubsOptions,
): ManyPubsReturnValues<P> => {
	const {
		query: optionsQuery = {},
		pubOptions: initialPubOptions = {},
		batchSize = 50,
		isEager = true,
		initialPubs = [],
		initiallyLoadedAllPubs = false,
	} = options;
	const { communityData } = usePageContext();
	const [pubOptions] = useState(initialPubOptions);

	const keyQuery: KeyedPubsQuery = {
		term: optionsQuery.term,
		scopedCollectionId: optionsQuery.scopedCollectionId,
		ordering: optionsQuery.ordering || defaultOrdering,
	};

	const queryKey = getQueryKey(keyQuery);

	const [pubsById, setPubsById] = useState<Record<string, Pub>>(() =>
		indexByProperty(initialPubs, 'id'),
	);

	const [manyPubsState, setManyPubsState] = useState<ManyPubsState>(() => {
		if (Object.keys(pubsById).length > 0 || initiallyLoadedAllPubs) {
			return {
				[queryKey]: getInitialPubsState(keyQuery, pubsById, initiallyLoadedAllPubs),
			};
		}
		return {};
	});

	const state = manyPubsState[queryKey] || initialQueryState;

	const setState = useCallback(
		(next: QueryState) => {
			setManyPubsState((currentState) => {
				return {
					...currentState,
					[queryKey]: next,
				};
			});
		},
		[queryKey],
	);

	const loadMorePubs = async () => {
		if (state.isLoading) {
			return;
		}

		const nextState = getStartLoadingPubsState(state, batchSize);
		setState(nextState);

		const query: ManyPubsQuery = {
			...keyQuery,
			...optionsQuery,
			limit: batchSize,
			offset: state.offset,
			communityId: communityData.id,
		};

		const result: ManyPubsApiResult = await apiFetch.post('/api/pubs/many', {
			query,
			pubOptions,
			alreadyFetchedPubIds: Object.keys(pubsById),
		});

		const { loadedAllPubs, pubsById: newPubsById, pubIds } = result;
		const nextPubsById = { ...pubsById, ...newPubsById };
		const resolvedPubs = pubIds.map((id) => nextPubsById[id]);
		const resolvedPubsById = indexByProperty(resolvedPubs, 'id');
		setState(getFinishedLoadingPubsState(nextState, query, resolvedPubsById, loadedAllPubs));
		setPubsById(nextPubsById);
	};

	useEffect(() => {
		if (isEager && state.offset === 0) {
			loadMorePubs();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isEager, queryKey, state.offset]);

	return {
		currentQuery: {
			loadMorePubs,
			isLoading: state.isLoading,
			hasLoadedAllPubs: state.hasLoadedAllPubs,
			pubs: state.orderedPubs.pubsInOrder as P[],
		},
		allQueries: {
			isLoading: Object.values(manyPubsState).some((s) => s.isLoading),
		},
	};
};
