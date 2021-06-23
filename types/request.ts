import { Community } from './community';
import { Collection } from './collection';
import { Pub } from './pub';
import { Member, MemberPermission } from './member';
import { DefinitelyHas, Maybe } from './util';
import { Scope } from './scope';

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
	scope: Scope;
	memberData: Member[];
};

export type InitialData = {
	scopeData: ScopeData;
	locationData: LocationData;
	loginData: LoginData;
	communityData: DefinitelyHas<Community, 'collections' | 'pages'>;
};
