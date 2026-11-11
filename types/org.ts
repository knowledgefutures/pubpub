import type { Org as OrgModel } from 'server/org/model';
import type { OrgFeaturedPub as OrgFeaturedPubModel } from 'server/orgFeaturedPub/model';

import type { SerializedModel } from './serializedModel';

export type Org = SerializedModel<OrgModel>;
export type OrgFeaturedPub = SerializedModel<OrgFeaturedPubModel>;

/** The shape returned by the org landing page query */
export type OrgWithCommunities = Org & {
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

/** The shape returned for the /orgs directory listing */
export type OrgDirectoryEntry = Org & {
	communityCount: number;
	pubCount: number;
};
