import type { FeatureFlag, FeatureFlagCommunity, FeatureFlagUser } from 'server/models';
import type * as types from 'types';

import { expect } from 'utils/assert';
import { getPsuedorandomFractionForUuid } from 'utils/psuedorandom';

type FeatureFlagOverride = FeatureFlagUser | FeatureFlagCommunity;

const passesThresholdFraction = (
	featureFlagUuid: string,
	targetModelUuid: null | string,
	threshold: number,
) => {
	if (threshold === 0 || !targetModelUuid) {
		return false;
	}
	const featureFlagValue = getPsuedorandomFractionForUuid(featureFlagUuid);
	const targetModelValue = getPsuedorandomFractionForUuid(targetModelUuid);
	return (featureFlagValue + targetModelValue) % 1 <= threshold;
};

export const getOverrideState = (
	featureFlagId: string,
	overrides: FeatureFlagOverride[],
): types.FeatureFlagOverrideState => {
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
		passesThresholdFraction(featureFlagId, userId, expect(enabledUsersFraction)) ||
		passesThresholdFraction(featureFlagId, communityId, expect(enabledCommunitiesFraction))
	);
};
