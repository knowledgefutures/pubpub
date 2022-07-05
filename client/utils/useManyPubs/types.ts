import { Pub, PubsQuery, DefinitelyHas, PubGetOptions } from 'types';

export type ManyPubsQuery = DefinitelyHas<PubsQuery, 'ordering' | 'limit'>;
export type KeyedPubsQuery = Pick<
	ManyPubsQuery,
	| 'term'
	| 'scopedCollectionId'
	| 'ordering'
	| 'isReleased'
	| 'submissionStatuses'
	| 'relatedUserIds'
>;

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

type PartialQuery = Omit<PubsQuery, 'communityId' | 'limit' | 'offset'>;

export type ManyPubsState = Record<QueryKey, QueryState>;

export type ManyPubsOptions = {
	initialPubs?: Pub[];
	initiallyLoadedAllPubs?: boolean;
	pubOptions?: PubGetOptions;
	query?: PartialQuery;
	batchSize?: number;
	isEager?: boolean;
	cacheQueries?: boolean;
};

export type ManyPubsReturnValues<P> = {
	currentQuery: {
		pubs: P[];
		loadMorePubs: () => unknown;
		isLoading: boolean;
		hasLoadedAllPubs: boolean;
	};
	allQueries: {
		isLoading: boolean;
	};
};
