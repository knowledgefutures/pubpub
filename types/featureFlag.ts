import { User } from './user';
import { Community } from './community';

export type FeatureFlagOverrideState = 'inert' | 'off' | 'on';

export type FeatureFlagUser = {
	id: string;
	featureFlagId: string;
	userId: string;
	enabled: boolean;
	user?: User;
};

export type FeatureFlagCommunity = {
	id: string;
	featureFlagId: string;
	communityId: string;
	enabled: boolean;
	community?: Community;
};

export type FeatureFlag = {
	id: string;
	name: string;
	enabledCommunitiesFraction: number;
	enabledUsersFraction: number;
	users?: FeatureFlagUser[];
	communities?: FeatureFlagCommunity[];
};
