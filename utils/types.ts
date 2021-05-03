import { LayoutBlock, CollectionLayout } from 'utils/layout/types';
import { CommunityNavigationEntry } from 'client/utils/navigation';
import { NodeLabelMap } from 'client/components/Editor/types';

export type AttributableUser = {
	id: string;
	slug: string;
	initials: string;
	fullName: string;
	firstName: string;
	lastName: string;
	avatar: string;
	title: string;
	orcid: string;
	isShadowUser?: boolean;
};

export type User = AttributableUser & {
	slug: string;
	bio: string;
	publicEmail: string;
	location: string;
	website: string;
	facebook: string;
	twitter: string;
	github: string;
	googleScholar: string;
};

export type PubAttribution = {
	id: string;
	name: string;
	avatar?: string;
	title?: string;
	order: number;
	isAuthor?: boolean;
	roles?: string[];
	affiliation?: string;
	orcid?: string;
	userId?: string;
	user?: AttributableUser;
	createdAt: string;
};

export type CollectionAttribution = {
	id: string;
	name: string;
	avatar?: string;
	title?: string;
	order: number;
	isAuthor?: boolean;
	roles?: string[];
	affiliation?: string;
	orcid?: string;
	userId?: string;
	user?: AttributableUser;
	createdAt: string;
};

export type Attribution = CollectionAttribution | PubAttribution;
export type AttributionWithUser = Attribution & { user: AttributableUser };

export const isAttributionWithUser = (
	attribution: Attribution,
): attribution is AttributionWithUser => 'user' in attribution && !!attribution.user;

export type Collection = {
	id: string;
	title: string;
	slug: string;
	avatar?: string;
	isRestricted?: boolean;
	isPublic?: boolean;
	viewHash?: string;
	editHash?: string;
	metadata?: { [k: string]: any };
	kind?: 'tag' | 'issue' | 'book' | 'conference';
	doi?: string;
	readNextPreviewSize: 'none' | 'minimal' | 'medium' | 'choose-best';
	pageId?: null | string;
	communityId: string;
	attributions?: CollectionAttribution[];
	layout: CollectionLayout;
	createdAt: string;
	scopeSummaryId: null | string;
	scopeSummary?: ScopeSummary;
};

export type CollectionPub = {
	id: string;
	pubId: string;
	collectionId: string;
	contextHint?: null | string;
	rank: string;
	pubRank: string;
	collection?: Collection;
	pub?: Pub;
};

export type Export = {
	id: string;
	format: string;
	url?: string;
	historyKey: string;
	workerTaskId?: string;
};

export type MemberPermission = 'view' | 'edit' | 'manage' | 'admin';

export type Member = {
	id?: string;
	permissions: MemberPermission;
	isOwner?: boolean;
	userId: string;
	pubId?: string;
	collectionId?: string;
	communityId?: string;
	organizationId?: string;
};

export type DocJson = { type: 'doc'; attrs: any; content: any[] };

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
	doc?: DocJson;
};

export type PubVersion = {
	id: string;
	historyKey?: number;
	pubId?: string;
};

export type ExternalPublication = {
	title: string;
	url: string;
	contributors?: string[];
	doi?: string;
	description?: string;
	avatar?: string;
	publicationDate?: string;
};

export type PubEdge = {
	id: string;
	pubId: string;
	externalPublicationId?: number;
	targetPubId?: string;
	relationType: string;
	rank: string;
	pubIsParent: boolean;
	approvedByTarget: boolean;
	externalPublication?: ExternalPublication;
	targetPub?: Pub;
	pub?: Pub;
};

export type OutboundEdge = Omit<PubEdge, 'pub'>;
export type InboundEdge = Omit<PubEdge, 'targetPub'>;

export type CrossrefDepositRecord = {
	id: string;
	depositJson?: {};
};

export type Draft = {
	id: string;
	latestKeyAt?: string;
	firebasePath: string;
};

export type Pub = {
	createdAt: string;
	updatedAt: string;
	id: string;
	slug: string;
	title: string;
	description?: string;
	avatar?: string;
	headerStyle: 'white-blocks' | 'black-blocks' | 'dark' | 'light';
	headerBackgroundColor?: string;
	headerBackgroundImage?: string;
	firstPublishedAt?: string;
	lastPublishedAt?: string;
	customPublishedAt?: string;
	doi?: string;
	labels?: string;
	downloads?: any[];
	metadata?: {};
	licenseSlug?: string;
	citationStyle?: string;
	citationInlineStyle?: string;
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

export type PubPageData = DefinitelyHas<Pub, 'attributions' | 'collectionPubs'> &
	PubDocInfo & {
		discussions: DefinitelyHas<Discussion, 'anchors' | 'thread'>[];
		viewHash: Maybe<string>;
		editHash: Maybe<string>;
		isReadOnly: boolean;
		isRelease: boolean;
		isInMaintenanceMode?: boolean;
		firebaseToken?: string;
		initialStructuredCitations: boolean;
		releaseNumber: Maybe<number>;
	};

export type Page = {
	id: string;
	title: string;
	slug: string;
	description?: string;
	avatar?: string;
	isPublic: boolean;
	isNarrowWidth?: boolean;
	viewHash?: string;
	layout: LayoutBlock[];
};

export type Community = {
	id: string;
	subdomain: string;
	domain?: string;
	description?: string;
	createdAt: string;
	title: string;
	avatar?: string;
	favicon?: string;
	accentColorLight?: string;
	accentColorDark?: string;
	hideCreatePubButton?: boolean;
	headerLogo?: string;
	headerLinks?: { title: string; url: string; external?: boolean }[];
	headerColorType?: 'light' | 'dark' | 'custom';
	useHeaderTextAccent?: boolean;
	hideHero?: boolean;
	hideHeaderLogo?: boolean;
	heroLogo?: string;
	heroBackgroundImage?: string;
	heroBackgroundColor?: string;
	heroTextColor?: string;
	useHeaderGradient?: boolean;
	heroImage?: string;
	heroTitle?: string;
	heroText?: string;
	heroPrimaryButton?: {};
	heroSecondaryButton?: {};
	heroAlign?: string;
	navigation: CommunityNavigationEntry[];
	hideNav?: boolean;
	footerLinks?: CommunityNavigationEntry[];
	footerTitle?: string;
	footerImage?: string;
	website?: string;
	facebook?: string;
	twitter?: string;
	email?: string;
	issn?: string;
	isFeatured?: boolean;
	viewHash?: string;
	editHash?: string;
	premiumLicenseFlag?: boolean;
	defaultPubCollections: string[];
	organizationId?: string;
	collections?: Collection[];
	pages?: Page[];
	pubs?: Pub[];
	scopeSummaryId: null | string;
	scopeSummary?: ScopeSummary;
};

export type DiscussionAnchor = {
	id: string;
	discussionId: string;
	historyKey: number;
	selection: null | { type: 'text'; anchor: number; head: number };
	originalText: string;
	originalTextPrefix: string;
	originalTextSuffix: string;
	isOriginal: boolean;
};

export type VisibilityUser = {
	id: string;
	visibilityId: string;
	userId: string;
};

export type Visibility = {
	id: string;
	access: 'private' | 'members' | 'public';
	users: VisibilityUser[];
};

export type ThreadComment = {
	id: string;
	text: string;
	content: {};
	userId: string;
	threadId: string;
};

export type Thread = {
	id: string;
	updatedAt: string;
	createdAt: string;
	locked?: boolean;
	comments: ThreadComment[];
};

export type Discussion = {
	id: string;
	title: string;
	number: number;
	isClosed: boolean;
	labels: string[];
	threadId: string;
	visibilityId: string;
	userId: string;
	pubId: string;
	anchors?: DiscussionAnchor[];
	visibility: Visibility;
	thread?: Thread;
};

export type Review = {
	id: string;
	createdAt: string;
	updatedAt: string;
	title: string;
	number: number;
	status: 'open' | 'closed' | 'completed';
	releaseRequested: boolean;
	threadId: string;
	thread?: Thread;
	visibilityId: string;
	visibility?: Visibility;
	userId: string;
	pubId: string;
};

export type ScopeSummary = {
	collections: number;
	pubs: number;
	discussions: number;
	reviews: number;
};

export type LoginData = {
	id: string | null;
	initials: Maybe<string>;
	slug: Maybe<string>;
	fullName: Maybe<string>;
	firstName: Maybe<string>;
	lastName: Maybe<string>;
	avatar: Maybe<string>;
	title: Maybe<string>;
	gdprConsent: Maybe<boolean>;
};

export type LocationData = {
	hostname: string;
	path: string;
	params: { [k: string]: string };
	query: { [k: string]: string };
	queryString: string;
	isBasePubPub: boolean;
	isProd: boolean;
	isDuqDuq: boolean;
	appCommit: string;
};

export type ScopeData = {
	activePermissions: {
		activePermission: MemberPermission;
		canAdmin: boolean;
		canAdminCommunity: boolean;
		canCreateDiscussions: boolean;
		canCreateReviews: boolean;
		canEdit: boolean;
		canEditDraft: boolean;
		canManage: boolean;
		canManageCommunity: boolean;
		canView: boolean;
		canViewDraft: boolean;
		isSuperAdmin: boolean;
	};
	elements: {
		activeTarget: Community | Collection | Pub;
		activeTargetType: 'community' | 'collection' | 'pub';
		activeTargetName: string;
		activeCommunity: Community;
		activeCollection?: Collection;
		activePub?: Pub;
		inactiveCollections?: Collection[];
	};
	memberData: Member[];
};

export type InitialData = {
	scopeData: ScopeData;
	locationData: LocationData;
	loginData: LoginData;
	communityData: DefinitelyHas<Community, 'collections' | 'pages'>;
};

export type Falsy = false | null | undefined | '' | 0;
export type Maybe<X> = X extends Falsy ? never : X | Falsy;
export type Some<X> = X extends Falsy ? never : X;
export type DefinitelyHas<X extends {}, Keys> = X & { [k in keyof X & Keys]: Some<X[k]> };

type PatchFnUpdaterArg<T> = (current: T) => Partial<T>;
type PatchFnPatchArg<T> = Partial<T>;
export type PatchFnArg<T> = PatchFnPatchArg<T> | PatchFnUpdaterArg<T>;
export type PatchFn<T> = (arg: PatchFnArg<T>) => unknown;

export type PubsQueryOrderingField =
	| 'collectionRank'
	| 'publishDate'
	| 'updatedDate'
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
	term?: string;
};

export type PubEdgeIncludesOptions = {
	includeCommunityForPubs?: boolean;
	includeTargetPub?: boolean;
	includePub?: boolean;
};

export type PubGetOptions = {
	isAuth?: boolean;
	isPreview?: boolean;
	getCollections?: boolean;
	getMembers?: boolean;
	getCommunity?: boolean;
	getExports?: boolean;
	getEdges?: 'all' | 'approved-only';
	getDraft?: boolean;
	getDiscussions?: boolean;
	getReviews?: boolean;
	getEdgesOptions?: PubEdgeIncludesOptions;
};

export type UserScopeVisit = {
	id: string;
	communityId: string;
	updatedAt: string;
	collectionId: null | string;
	pubId: null | string;
	userId: string;
};

export type CustomScriptType = 'css' | 'js';
export type CustomScripts = { [type in CustomScriptType]: null | string };
