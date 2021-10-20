import { FeatureFlagUser } from 'server/models';
import { createOverrideSetter } from 'server/featureFlag/overrideState';

export const setFeatureFlagOverrideForUser = createOverrideSetter(FeatureFlagUser, (userId) => ({
	userId,
}));
