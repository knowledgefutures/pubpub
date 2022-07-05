import { useCallback, useEffect, useState } from 'react';
import { useUpdate, useUpdateEffect } from 'react-use';

import { Pub } from 'types';
import { usePageContext } from 'utils/hooks';
import { indexByProperty } from 'utils/arrays';
import { apiFetch } from 'client/utils/apiFetch';
import { useLazyRef } from 'client/utils/useLazyRef';

import {
	getStartLoadingPubsState,
	getFinishedLoadingPubsState,
	initialQueryState,
	getInitialPubsState,
} from './state';
import {
	KeyedPubsQuery,
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
		isReleased,
		submissionStatuses,
		relatedUserIds,
	} = query;
	return JSON.stringify({
		submissionStatuses,
		term,
		scopedCollectionId,
		field,
		direction,
		isReleased,
		relatedUserIds,
	});
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
		cacheQueries = true,
	} = options;

	const { communityData } = usePageContext();
	const [pubOptions] = useState(initialPubOptions);
	const update = useUpdate();

	const keyQuery: KeyedPubsQuery = {
		term: optionsQuery.term,
		scopedCollectionId: optionsQuery.scopedCollectionId,
		ordering: optionsQuery.ordering || defaultOrdering,
		isReleased: optionsQuery.isReleased,
		submissionStatuses: optionsQuery.submissionStatuses,
		relatedUserIds: optionsQuery.relatedUserIds,
	};

	const pubsById = useLazyRef(() => indexByProperty(initialPubs, 'id'));
	const queryKey = getQueryKey(keyQuery);
	const manyPubsState = useLazyRef(() => {
		if (Object.keys(pubsById.current).length > 0 || initiallyLoadedAllPubs) {
			return {
				[queryKey]: getInitialPubsState(keyQuery, pubsById.current, initiallyLoadedAllPubs),
			};
		}
		return {};
	});

	const getCurrentQueryState = useCallback(() => {
		return manyPubsState.current[queryKey] || initialQueryState;
	}, [queryKey, manyPubsState]);

	const setCurrentQueryState = useCallback(
		(next: QueryState) => {
			manyPubsState.current = {
				...manyPubsState.current,
				[queryKey]: next,
			};
			update();
		},
		[queryKey, update, manyPubsState],
	);

	const loadMorePubs = async () => {
		const queryState = getCurrentQueryState();
		const { isLoading, hasLoadedAllPubs, offset } = queryState;

		if (isLoading || hasLoadedAllPubs) {
			return;
		}

		const query: ManyPubsQuery = {
			...keyQuery,
			...optionsQuery,
			limit: batchSize,
			offset,
			communityId: communityData.id,
		};

		const nextQueryState = getStartLoadingPubsState(queryState, batchSize);
		setCurrentQueryState(nextQueryState);

		const result: ManyPubsApiResult = await apiFetch.post('/api/pubs/many', {
			query,
			pubOptions,
			alreadyFetchedPubIds: Object.keys(pubsById.current),
		});

		const { loadedAllPubs, pubsById: newPubsById, pubIds } = result;
		const nextPubsById = { ...pubsById.current, ...newPubsById };
		const resolvedPubs = pubIds.map((id) => nextPubsById[id]);
		const resolvedPubsById = indexByProperty(resolvedPubs, 'id');
		pubsById.current = nextPubsById;
		setCurrentQueryState(
			getFinishedLoadingPubsState(nextQueryState, query, resolvedPubsById, loadedAllPubs),
		);
	};

	useUpdateEffect(() => {
		if (!cacheQueries) {
			pubsById.current = {};
			manyPubsState.current = { [queryKey]: initialQueryState };
		}
	}, [cacheQueries, queryKey]);

	useEffect(() => {
		const queryState = getCurrentQueryState();
		if (isEager && queryState.offset === 0) {
			loadMorePubs();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isEager, queryKey]);

	const currentQueryState = getCurrentQueryState();
	return {
		currentQuery: {
			loadMorePubs,
			isLoading: currentQueryState.isLoading,
			hasLoadedAllPubs: currentQueryState.hasLoadedAllPubs,
			pubs: currentQueryState.orderedPubs.pubsInOrder as P[],
		},
		allQueries: {
			isLoading: Object.values(manyPubsState.current).some((s) => s.isLoading),
		},
	};
};
