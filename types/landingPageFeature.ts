import { Community, DefinitelyHas, DocJson, Pub } from 'types';

export type LandingPageFeature = {
	id: string;
	communityId: null | string;
	pubId: null | string;
	rank: string;
	createdAt: string;
	updatedAt: string;
	pub?: null | DefinitelyHas<Pub, 'attributions' | 'collectionPubs' | 'community' | 'releases'>;
	community?: null | Community;
	payload: null | Record<string, any>;
};

export type LandingPageFeatureKind = 'pub' | 'community';

export type LandingPagePubFeature = DefinitelyHas<LandingPageFeature, 'pub'>;

export type LandingPageCommunityFeature = DefinitelyHas<LandingPageFeature, 'community'>;

export type ValidLandingPageCommunityFeature = LandingPageCommunityFeature & {
	payload: {
		imageUrl: string;
		quote: DocJson;
		highlights: DocJson;
		backgroundColor?: string | undefined;
	};
};

export type LandingPageFeatureOfKind<Kind extends LandingPageFeatureKind> = Kind extends 'pub'
	? LandingPagePubFeature
	: Kind extends 'community'
	? LandingPageCommunityFeature
	: never;

export type LandingPageFeatures<Validated extends boolean = true> = {
	pub: LandingPagePubFeature[];
	community: (Validated extends true
		? ValidLandingPageCommunityFeature
		: LandingPageCommunityFeature)[];
};
