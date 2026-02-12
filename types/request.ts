import type { CascadedFacetsByKind } from 'facets';
import type {
	Collection,
	Community,
	DefinitelyHas,
	DiscussionCreationAccess,
	Integration,
	Member,
	MemberPermission,
	Pub,
	ScopeId,
} from 'types';
import type { UserDismissableKey } from 'utils/userDismissable';

export type LoginData = {
	id: string | null;
	initials?: string;
	slug?: string;
	fullName?: string;
	firstName?: string;
	lastName?: string;
	avatar?: string;
	title?: string;
	gdprConsent?: boolean | null;
	isSuperAdmin: boolean;
	integrations?: Integration[];
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
	isQubQub: boolean;
	isDashboard: boolean;
	appCommit: string;
	turnstileSiteKey?: string;
};

export type ScopeData = {
	activePermissions: {
		activePermission: MemberPermission | null;
		canAdmin: boolean;
		canAdminCommunity: boolean;
		canCreateDiscussions: boolean;
		canCreateReviews: boolean;
		canEdit: boolean;
		canEditDraft: boolean;
		canManage: boolean;
		canManageCommunity: boolean;
		canEditCommunity: boolean;
		canViewCommunity: boolean;
		canView: boolean;
		canViewDraft: boolean;
		isSuperAdmin: boolean;
		/**
		 * Hacky: this is the value for the current scope's discussion creation access, not the
		 * user's. Refer to canCreateDiscussions for the user's access.
		 */
		discussionCreationAccess: DiscussionCreationAccess;
	};
	elements: {
		activeIds: {
			communityId: string;
			collectionId: string | null;
			pubId: string | null;
		};
		activeTarget: Community | Collection | Pub | null;
		activeTargetType: 'community' | 'collection' | 'pub';
		activeTargetName: string;
		activeCommunity: Community;
		activeCollection: Collection | null;
		activePub: Pub | null;
		inactiveCollections: Collection[];
	};
	activeCounts: {
		reviews: number;
		submissions: number;
	};
	scope: ScopeId;
	memberData: Member[];
	facets?: CascadedFacetsByKind;
};

export type InitialCommunityData = DefinitelyHas<
	Community,
	'collections' | 'pages' | 'scopeSummary'
>;

export type InitialNotificationsData = {
	hasNotifications: boolean;
	hasUnreadNotifications: boolean;
};

export type InitialData = {
	scopeData: ScopeData;
	locationData: LocationData;
	loginData: LoginData;
	communityData: InitialCommunityData;
	featureFlags: Record<string, boolean>;
	initialNotificationsData: InitialNotificationsData;
	dismissedUserDismissables: Partial<Record<UserDismissableKey, true>>;
};
