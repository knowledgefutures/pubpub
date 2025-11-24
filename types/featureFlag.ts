import type {
	FeatureFlagCommunity as FeatureFlagCommunityModel,
	FeatureFlag as FeatureFlagModel,
	FeatureFlagUser as FeatureFlagUserModel,
} from 'server/models';

import type { SerializedModel } from './serializedModel';

export type FeatureFlagOverrideState = 'inert' | 'off' | 'on';

export type FeatureFlagUser = SerializedModel<FeatureFlagUserModel>;

export type FeatureFlagCommunity = SerializedModel<FeatureFlagCommunityModel>;

export type FeatureFlag = SerializedModel<FeatureFlagModel>;
