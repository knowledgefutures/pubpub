import type { Hub as HubModel } from 'server/hub/model';
import type { HubCommunity as HubCommunityModel } from 'server/hubCommunity/model';
import type { HubPub as HubPubModel } from 'server/hubPub/model';

import type { SerializedModel } from './serializedModel';

export type Hub = SerializedModel<HubModel>;
export type HubCommunity = SerializedModel<HubCommunityModel>;
export type HubPub = SerializedModel<HubPubModel>;

/** The shape returned by the org landing page query */
export type HubWithCommunities = Hub & {
	communities: Array<{
		id: string;
		subdomain: string;
		domain: string | null;
		title: string;
		description: string | null;
		heroBackgroundImage: string | null;
		heroLogo: string | null;
		accentColorLight: string | null;
		accentColorDark: string | null;
		headerLogo: string | null;
		headerColorType: string | null;
		createdAt: string;
		updatedAt: string;
		pubCount: number;
	}>;
	featuredPubs: Array<{
		id: string;
		title: string;
		slug: string;
		avatar: string | null;
		description: string | null;
		communityId: string;
		communityTitle: string;
		communitySlug: string;
		communityDomain: string | null;
		communityAccent: string | null;
		byline: string;
		publishedAt: string | null;
	}>;
};

/** The shape returned for the /hubs directory listing */
export type HubDirectoryEntry = Hub & {
	communityCount: number;
	pubCount: number;
};
