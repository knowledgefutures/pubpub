import type {
	Collection,
	DashboardMenuState,
	InitialCommunityData,
	InitialData,
	InitialNotificationsData,
	LocationData,
	LoginData,
	Maybe,
	Page,
	PatchFn,
	ScopeData,
} from 'types';

import type { NoteManager } from '../client/utils/notes';

export type PageContext = {
	scopeData: ScopeData;
	loginData: LoginData;
	locationData: LocationData;
	pageData: Maybe<Page>;
	communityData: InitialCommunityData;
	updateCommunity: PatchFn<InitialCommunityData>;
	updateCollection: PatchFn<Collection>;
	featureFlags: Record<string, boolean>;
	noteManager: NoteManager;
	initialNotificationsData: InitialNotificationsData;
	dashboardMenu: DashboardMenuState;
	dismissedUserDismissables: InitialData['dismissedUserDismissables'];
	gdprConsent: boolean | null;
	setGdprConsent: (consent: boolean | null) => void;
};
