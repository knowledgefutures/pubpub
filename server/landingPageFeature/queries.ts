import * as types from 'types';
import { Community, LandingPageFeature, Pub } from 'server/models';
import { splitArrayOn } from 'utils/arrays';
import { buildPubOptions } from 'server/utils/queryHelpers';
import { validateCommunityLandingPageFeature } from 'utils/landingPage/validate';

const landingPageFeatureIncludes = [
	{ model: Pub, as: 'pub', ...buildPubOptions({ getCommunity: true, getCollections: true }) },
	{ model: Community, as: 'community' },
];

type GetLandingPageFeaturesOptions<Validated extends boolean> = {
	onlyValidItems?: Validated;
};

export const getLandingPageFeatures = async <Validated extends boolean = true>(
	options: GetLandingPageFeaturesOptions<Validated> = {},
): Promise<types.LandingPageFeatures<Validated>> => {
	const { onlyValidItems = true } = options;
	const features = await LandingPageFeature.findAll({
		include: landingPageFeatureIncludes,
		order: [['rank', 'ASC']],
	});
	const [pubFeatures, communityFeatures] = splitArrayOn(features, (f) => !!f.pub);
	const sanitizedPubFeatures = pubFeatures.filter(
		(feature) => feature.pub?.releases?.length! > 0,
	);
	const validatedCommunityFeatures = onlyValidItems
		? communityFeatures.filter((feature) => validateCommunityLandingPageFeature(feature as any))
		: communityFeatures;

	const serializedValidatedCommunityFeatures = validatedCommunityFeatures.map((feature) =>
		feature.toJSON(),
	);
	return {
		pub: sanitizedPubFeatures as types.LandingPagePubFeature[],
		community: serializedValidatedCommunityFeatures as (Validated extends true
			? types.ValidLandingPageCommunityFeature
			: types.DefinitelyHas<types.LandingPageFeature, 'community'>)[],
	};
};

type CreateLandingPageFeatureOptions = {
	pubId?: string;
	communityId?: string;
	rank: string;
};

export const createLandingPageFeature = async (options: CreateLandingPageFeatureOptions) => {
	const { pubId, communityId, rank } = options;
	const newFeature = await LandingPageFeature.create({ pubId, communityId, rank });
	return LandingPageFeature.findOne({
		where: { id: newFeature.id },
		include: landingPageFeatureIncludes,
	});
};

type UpdateLandingPageFeatureOptions = {
	id: string;
	rank?: string;
	payload?: Record<string, any>;
};

export const updateLandingPageFeature = async (options: UpdateLandingPageFeatureOptions) => {
	const { id, rank, payload } = options;
	await LandingPageFeature.update({ rank, payload }, { where: { id }, limit: 1 });
};

type destroyLandingPageFeatureOptions = {
	id: string;
};

export const destroyLandingPageFeature = async (options: destroyLandingPageFeatureOptions) => {
	const { id } = options;
	return LandingPageFeature.destroy({ where: { id }, limit: 1 });
};
