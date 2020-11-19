import { LayoutBlock, CollectionLayout } from 'utils/layout/types';
import { CommunityNavigationEntry } from 'client/utils/navigation';

export type AttributableUser = {
	id: string;
	initials: string;
	fullName: string;
	firstName: string;
	lastName: string;
	avatar: string;
	title: string;
	orcid: string;
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
	roles?: {};
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
	roles?: {};
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
	isRestricted?: string;
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
};

export type CollectionPub = {
	id: string;
	pubId: string;
	collectionId: string;
	contextHint?: string;
	rank: string;
	pubRank: string;
	isPrimary: boolean;
	collection?: Collection;
	pub?: Pub;
};

export type Export = {
	id: string;
	branchId: string;
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

export type Branch = {
	id: string;
	shortId: string;
	title?: string;
	description?: string;
	submissionAlias?: string;
	order?: number;
	viewHash?: string;
	discussHash?: string;
	editHash?: string;
	firstKeyAt?: string;
	latestKeyAt?: string;
	pubId: string;
	maintenanceDocId?: string;
};

export type Release = {
	id: string;
	noteContent?: {};
	noteText?: string;
	branchKey: number;
	pubId: string;
	branchId: string;
	userId: string;
	sourceBranchId: string;
	sourceBranchKey: number;
	createdAt: string;
	updatedAt: string;
};

export type PubVersion = {
	id: string;
	historyKey?: number;
	branchId?: string;
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

export type Pub = {
	createdAt: string;
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
	attributions?: PubAttribution[];
	collectionPubs?: CollectionPub[];
	exports?: Export[];
	members?: Member[];
	branches?: Branch[];
	releases: Release[];
	pubVersions?: PubVersion[];
	crossrefDepositRecord?: CrossrefDepositRecord;
	inboundEdges?: InboundEdge[];
	outboundEdges?: OutboundEdge[];
	pubEdgeListingDefaultsToCarousel: boolean;
	pubEdgeDescriptionVisible: boolean;
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
	createdAt: string;
	title: string;
	avatar?: string;
	favicon?: string;
	accentColorLight?: string;
	accentColorDark?: string;
	hideCreatePubButton?: boolean;
	headerLogo?: string;
	headerLinks?: string;
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
};

export type ScopeData = {
	activePermissions: {
		activePermission: MemberPermission;
		canAdmin: boolean;
		canAdminCommunity: boolean;
		canCreateDiscussions: boolean;
		canCreateForks: boolean;
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
		activeTargetType: 'community' | 'collection' | 'pub';
		activeTargetName: string;
		activeCommunity?: Community;
		activeCollection?: Collection;
		activePub?: Pub;
		inactiveCollections?: Collection[];
	};
	memberData: Member[];
};
