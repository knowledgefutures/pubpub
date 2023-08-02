import { LandingPageFeature as LandingPageFeatureModel } from 'server/models';
import { DefinitelyHas, DocJson } from 'types';
import { SerializedModel } from './serializedModel';

export type LandingPageFeature = SerializedModel<LandingPageFeatureModel>;

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
