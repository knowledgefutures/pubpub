import { createOverrideSetter } from 'server/featureFlag/overrideState';
import { FeatureFlagCommunity } from 'server/models';

export const setFeatureFlagOverrideForCommunity = createOverrideSetter(
	FeatureFlagCommunity,
	(communityId) => ({ communityId }),
);
