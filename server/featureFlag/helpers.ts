import {
	FeatureFlag,
	FeatureFlagUser,
	FeatureFlagOverrideState,
	FeatureFlagCommunity,
} from 'types';

type FeatureFlagOverride = FeatureFlagUser | FeatureFlagCommunity;

const getRandomFractionForUuid = (uuid: string) => {
	const sixBytes = uuid.split('-').pop()!;
	return parseInt(sixBytes, 16) / 0xffffffffffff; // largest six-byte integer
};

const passesThresholdFraction = (
	featureFlagUuid: string,
	targetModelUuid: null | string,
	threshold: number,
) => {
	if (threshold === 0 || !targetModelUuid) {
		return false;
	}
	const featureFlagValue = getRandomFractionForUuid(featureFlagUuid);
	const targetModelValue = getRandomFractionForUuid(targetModelUuid);
	return (featureFlagValue + targetModelValue) % 1 <= threshold;
};

export const getOverrideState = (
	featureFlagId: string,
	overrides: FeatureFlagOverride[],
): FeatureFlagOverrideState => {
	const matchingOverride = overrides.find((o) => o.featureFlagId === featureFlagId);
	if (matchingOverride) {
		return matchingOverride.enabled ? 'on' : 'off';
	}
	return 'inert';
};

type GetEnabledForUserInCommunityOptions = {
	featureFlag: FeatureFlag;
	userId: null | string;
	communityId: null | string;
	featureFlagUsers: FeatureFlagUser[];
	featureFlagCommunities: FeatureFlagCommunity[];
};

export const isFeatureFlagEnabledForUserInCommunity = (
	options: GetEnabledForUserInCommunityOptions,
) => {
	const {
		featureFlag: { id: featureFlagId, enabledUsersFraction, enabledCommunitiesFraction },
		userId,
		communityId,
		featureFlagUsers,
		featureFlagCommunities,
	} = options;
	const overrideStates = [featureFlagUsers, featureFlagCommunities].map((overrides) =>
		getOverrideState(featureFlagId, overrides),
	);
	if (overrideStates.some((state) => state === 'off')) {
		return false;
	}
	if (overrideStates.some((state) => state === 'on')) {
		return true;
	}
	return (
		passesThresholdFraction(featureFlagId, userId, enabledUsersFraction) ||
		passesThresholdFraction(featureFlagId, communityId, enabledCommunitiesFraction)
	);
};
