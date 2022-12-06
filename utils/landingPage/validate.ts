import { LandingPageCommunityFeature, ValidLandingPageCommunityFeature } from 'types';
import {
	isAlwaysValid,
	isNonEmptyDocJson,
	isNonEmptyString,
	isTruthyAnd,
	RecordValidator,
	validate,
} from 'utils/validate';

const communityFeaturePayloadValidator: RecordValidator<
	ValidLandingPageCommunityFeature['payload']
> = {
	imageUrl: isNonEmptyString,
	quote: isTruthyAnd(isNonEmptyDocJson),
	highlights: isTruthyAnd(isNonEmptyDocJson),
	backgroundColor: isAlwaysValid,
};

export const validateCommunityLandingPageFeature = (
	feature: LandingPageCommunityFeature,
): null | LandingPageCommunityFeature => {
	const { payload } = feature;
	if (payload && validate(payload, communityFeaturePayloadValidator, true).isValidated) {
		return feature as LandingPageCommunityFeature;
	}
	return null;
};
