import type {
	Pub as PubModel,
	Draft as DraftModel,
	Doc as DocModel,
	Release as ReleaseModel,
	PubVersion as PubVersionModel,
	CrossrefDepositRecord,
} from 'server/models';
import { SerializedModel } from './serializedModel';
import { PubAttribution } from './attribution';
import { Collection, CollectionPub } from './collection';
import { Discussion } from './discussion';
import { DocJson } from './doc';
import { Member } from './member';
import { Submission, SubmissionStatus } from './submission';
import { ThreadComment, Thread } from './thread';
import { DefinitelyHas, Maybe } from './util';
import { UserSubscription } from './userSubscription';
import { PubGetOptions, PubsQuery } from './pubQuery';

export type Draft = SerializedModel<DraftModel>;
export type Doc = SerializedModel<DocModel>;
export type Release = SerializedModel<ReleaseModel>;

export type Export = {
	id: string;
	format: string;
	url?: string;
	historyKey: number;
	workerTaskId?: string;
};

export type PubVersion = SerializedModel<PubVersionModel>;
export type DepositRecord = SerializedModel<CrossrefDepositRecord>;
export type Pub = SerializedModel<PubModel>;

export type PubWithConnections = DefinitelyHas<Pub, 'inboundEdges' | 'outboundEdges'>;

export type PubDocInfo = {
	initialDoc: DocJson;
	initialDocKey: number;
	mostRecentRemoteKey?: number;
	historyData: {
		timestamps: Record<string, number>;
		currentKey: number;
		latestKey: number;
	};
};

export type PubPageDiscussion = DefinitelyHas<Discussion, 'anchors'> & {
	thread: Thread & {
		comments: DefinitelyHas<ThreadComment, 'author'>[];
	};
};

export type PubPageData = DefinitelyHas<Omit<Pub, 'discussions'>, 'collectionPubs'> &
	PubDocInfo & {
		membersData?: {
			members: Member[];
		};
		collectionPubs: DefinitelyHas<CollectionPub, 'collection'>[];
		discussions: PubPageDiscussion[];
		viewHash: Maybe<string>;
		editHash: Maybe<string>;
		reviewHash: Maybe<string>;
		commentHash: Maybe<string>;
		isRelease: boolean;
		isReviewingPub: boolean;
		isAVisitingCommenter: boolean;
		isInMaintenanceMode?: boolean;
		firebaseToken?: string;
		initialStructuredCitations: boolean;
		releaseNumber: Maybe<number>;
		submission?: DefinitelyHas<Submission, 'submissionWorkflow'>;
		subscription: null | UserSubscription;
	};

export type PubHistoryState = {
	currentKey: number;
	latestKey: number;
	isViewingHistory: boolean;
	loadedIntoHistory: boolean;
	historyDocEditorKey: string;
	historyDoc: null | DocJson;
	latestHistoryDoc: null | DocJson;
	outstandingRequests: number;
	latestKeyReceivedAt: Maybe<number>;
	timestamps: Record<string, number>;
};

export type PubDraftInfo = {
	doc: DocJson;
	size: number;
	mostRecentRemoteKey: number;
	firstTimestamp: number;
	latestTimestamp: number;
	historyData: Pick<PubHistoryState, 'currentKey' | 'latestKey' | 'timestamps'>;
};

type CollectionPubWithAttributions = CollectionPub & {
	collection: DefinitelyHas<Collection, 'attributions'>;
};

export type SanitizedPubData = Pub & {
	viewHash: string | null;
	editHash: string | null;
	reviewHash: string | null;
	commentHash: string | null;
	attributions: PubAttribution[];
	discussions: Discussion[];
	collectionPubs: CollectionPubWithAttributions[];
	isRelease: boolean;
	releases: Release[];
	releaseNumber: number | null;
};

export type PubWithCollections = Pub & {
	collectionPubs: DefinitelyHas<CollectionPub, 'collection'>[];
};

export type CanCreatePub = {
	userId?: string | null;
	communityId: string;
} & (
	| {
			collectionId?: string | null;
			createPubToken?: undefined;
	  }
	| {
			createPubToken?: string | null;
			collectionId?: undefined;
	  }
);

export type ManyRequestParams = {
	query: Omit<PubsQuery, 'communityId'>;
	alreadyFetchedPubIds: string[];
	pubOptions: PubGetOptions;
};

export type GetManyQuery = {
	excludeCollectionIds?: string[];
	ordering?: {
		field: 'updatedDate' | 'creationDate' | 'collectionRank' | 'title';
		direction: 'ASC' | 'DESC';
	};
	limit?: number;
	offset?: number;
	isReleased?: boolean;
	scopedCollectionId?: string;
	withinPubIds?: string[];
	term?: string;
	submissionStatuses?: SubmissionStatus[];
	relatedUserIds?: string[];
} & (
	| { collectionIds: string[]; pubIds?: undefined }
	| { pubIds: string[]; collectionIds?: undefined }
	| { pubIds?: undefined; collectionIds?: undefined }
);
