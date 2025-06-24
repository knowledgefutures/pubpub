import { SubmissionStatus } from 'types';

export type PubsQueryOrderingField =
	| 'collectionRank'
	| 'publishDate'
	| 'updatedDate'
	| 'submittedDate'
	| 'creationDate'
	| 'title';

export type PubsQueryOrdering = { field: PubsQueryOrderingField; direction: 'ASC' | 'DESC' };

export type PubsQuery = {
	collectionIds?: null | string[];
	excludeCollectionIds?: null | string[];
	communityId: string;
	excludePubIds?: null | string[];
	isReleased?: boolean;
	hasReviews?: boolean;
	limit?: null | number;
	offset?: number;
	ordering?: PubsQueryOrdering;
	scopedCollectionId?: string;
	withinPubIds?: null | string[];
	relatedUserIds?: string[];
	term?: string;
	submissionStatuses?: null | SubmissionStatus[];
};

export type PubEdgeIncludesOptions = {
	includeCommunityForPubs?: boolean;
	includeTargetPub?: boolean;
	includePub?: boolean;
};

export type PubGetOptions = {
	isAuth?: boolean;
	isPreview?: boolean;
	// get collection pubs for pub
	getCollections?:
		| boolean
		| {
				/**
				 * ```
				 * 	false - don't include collections
				 * 	{} - include collections with default options
				 * 	{ page: true } - include collections with page data
				 * 	{ members: true } - include collections with members data
				 * 	{ attributions: true } - include collections with attributions data
				 * ```
				 */
				collection:
					| false
					| {
							page?: boolean;
							members?: boolean;
							attributions?: boolean;
					  };
		  };
	getMembers?: boolean;
	getCommunity?: boolean;
	getExports?: boolean;
	getEdges?: 'all' | 'approved-only';
	getDraft?: boolean;
	getDiscussions?: boolean;
	getReviews?: boolean;
	getEdgesOptions?: PubEdgeIncludesOptions;
	getSubmissions?: boolean;
	getFacets?: boolean;
	/** Get releases with the docs. Only use when generating archives */
	getFullReleases?: boolean;
};
