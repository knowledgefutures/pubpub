import {
	Collection,
	Community,
	DefinitelyHas,
	Member,
	MemberPermission,
	Pub,
	ScopeId,
} from 'types';
import { CascadedFacetsByKind } from 'facets';

import { UserDismissableKey } from 'utils/userDismissable';

export type LoginData = {
	id: string | null;
	initials?: string;
	slug?: string;
	fullName?: string;
	firstName?: string;
	lastName?: string;
	avatar?: string;
	title?: string;
	gdprConsent?: string;
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
		canEditCommunity: boolean;
		canViewCommunity: boolean;
		canView: boolean;
		canViewDraft: boolean;
		isSuperAdmin: boolean;
	};
	elements: {
		activeIds: {
			communityId: string;
			collectionId?: string;
			pubId?: string;
		};
		activeTarget: Community | Collection | Pub;
		activeTargetType: 'organization' | 'community' | 'collection' | 'pub';
		activeTargetName: string;
		activeCommunity: Community;
		activeCollection?: Collection;
		activePub?: Pub;
		inactiveCollections?: Collection[];
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
