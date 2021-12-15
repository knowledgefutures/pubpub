import {
	Collection,
	InitialCommunityData,
	LocationData,
	LoginData,
	Maybe,
	Page,
	PatchFn,
	ScopeData,
} from 'types';
import { NoteManager } from 'client/utils/notes';

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
};
