import { Pub, PubsQuery, DefinitelyHas } from 'utils/types';

export type ManyPubsQuery = DefinitelyHas<PubsQuery, 'ordering' | 'limit'>;
export type KeyedPubsQuery = Pick<ManyPubsQuery, 'term' | 'scopedCollectionId' | 'ordering'>;

export type ManyPubsApiResult = {
	pubIds: string[];
	pubsById: Record<string, Pub>;
	loadedAllPubs: boolean;
};

export type OrderingValue = string | number;
export type OrderByFn = (pub: Pub, scopedCollectionId?: string) => OrderingValue;

export type OrderedPubs = {
	pubsById: Record<string, Pub>;
	orderingValuesByPubId: Record<string, OrderingValue>;
	pubsInOrder: Pub[];
};

export type QueryState = {
	orderedPubs: OrderedPubs;
	hasLoadedAllPubs: boolean;
	offset: number;
	isLoading: boolean;
};

type QueryKey = string;
export type ManyPubsState = Record<QueryKey, QueryState>;

export type ManyPubsOptions = {
	query?: Omit<PubsQuery, 'communityId' | 'limit' | 'offset'>;
	batchSize?: number;
};

export type ManyPubsReturnValues = {
	currentQuery: {
		pubs: Pub[];
		loadMorePubs: () => unknown;
		isLoading: boolean;
		hasLoadedAllPubs: boolean;
	};
	allQueries: {
		isLoading: boolean;
	};
};
