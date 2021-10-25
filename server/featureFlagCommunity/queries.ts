import { FeatureFlagCommunity } from 'server/models';
import { createOverrideSetter } from 'server/featureFlag/overrideState';

export const setFeatureFlagOverrideForCommunity = createOverrideSetter(
	FeatureFlagCommunity,
	(communityId) => ({ communityId }),
);
