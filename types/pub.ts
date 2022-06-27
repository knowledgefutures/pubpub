import { NodeLabelMap } from 'components/Editor';
import { CitationInlineStyleKind, CitationStyleKind } from 'utils/citations';

import { PubAttribution } from './attribution';
import { Collection, CollectionPub } from './collection';
import { Community } from './community';
import { Discussion } from './discussion';
import { DocJson } from './doc';
import { Member } from './member';
import { Review } from './review';
import { InboundEdge, OutboundEdge } from './pubEdge';
import { ScopeSummary } from './scope';
import { Submission } from './submission';
import { ThreadComment, Thread } from './thread';
import { DefinitelyHas, Maybe } from './util';
import { UserSubscription } from './userSubscription';

export type Draft = {
	id: string;
	latestKeyAt?: string;
	firebasePath: string;
};

export type Doc = {
	id: string;
	createdAt: string;
	updatedAt: string;
	content: DocJson;
};

export type Release = {
	id: string;
	noteContent?: {};
	noteText?: string;
	pubId: string;
	userId: string;
	createdAt: string;
	updatedAt: string;
	historyKey: number;
	docId: string;
	doc?: Doc;
};

export type Export = {
	id: string;
	format: string;
	url?: string;
	historyKey: string;
	workerTaskId?: string;
};

export type PubVersion = {
	id: string;
	historyKey?: number;
	pubId?: string;
};

export type CrossrefDepositRecord = {
	id: string;
	depositJson?: {};
};

export type Pub = {
	createdAt: string;
	updatedAt: string;
	id: string;
	slug: string;
	title: string;
	htmlTitle: null | string;
	description?: string;
	avatar?: string;
	headerStyle: 'white-blocks' | 'black-blocks' | 'dark' | 'light';
	headerBackgroundColor?: string;
	headerBackgroundImage?: string;
	firstPublishedAt?: string;
	lastPublishedAt?: string;
	customPublishedAt?: string;
	doi: null | string;
	labels?: string[];
	downloads?: any[];
	metadata?: {};
	licenseSlug?: string;
	citationStyle?: CitationStyleKind;
	citationInlineStyle?: CitationInlineStyleKind;
	viewHash?: string;
	editHash?: string;
	communityId: string;
	community?: Community;
	discussions?: Discussion[];
	attributions: PubAttribution[];
	collectionPubs?: CollectionPub[];
	exports?: Export[];
	members?: Member[];
	reviews?: Review[];
	releases: Release[];
	pubVersions?: PubVersion[];
	crossrefDepositRecord?: CrossrefDepositRecord;
	inboundEdges?: InboundEdge[];
	outboundEdges?: OutboundEdge[];
	pubEdgeListingDefaultsToCarousel?: boolean;
	pubEdgeDescriptionVisible?: boolean;
	nodeLabels?: NodeLabelMap;
	draftId?: string;
	draft?: Draft;
	scopeSummaryId: null | string;
	scopeSummary: ScopeSummary;
	submission?: Submission;
};

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
		isRelease: boolean;
		isInMaintenanceMode?: boolean;
		firebaseToken?: string;
		initialStructuredCitations: boolean;
		releaseNumber: Maybe<number>;
		submission?: DefinitelyHas<Submission, 'submissionWorkflow'>;
		iSubmission: boolean;
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
	attributions: PubAttribution[];
	discussions: Discussion[];
	collectionPubs: CollectionPubWithAttributions[];
	isRelease: boolean;
	releases: Release[];
	releaseNumber: number | null;
};
