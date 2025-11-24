import { createOverrideSetter } from 'server/featureFlag/overrideState';
import { FeatureFlagUser } from 'server/models';

export const setFeatureFlagOverrideForUser = createOverrideSetter(FeatureFlagUser, (userId) => ({
	userId,
}));
