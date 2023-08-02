import {
	FeatureFlag as FeatureFlagModel,
	FeatureFlagCommunity as FeatureFlagCommunityModel,
	FeatureFlagUser as FeatureFlagUserModel,
} from 'server/models';
import { SerializedModel } from './serializedModel';

export type FeatureFlagOverrideState = 'inert' | 'off' | 'on';

export type FeatureFlagUser = SerializedModel<FeatureFlagUserModel>;

export type FeatureFlagCommunity = SerializedModel<FeatureFlagCommunityModel>;

export type FeatureFlag = SerializedModel<FeatureFlagModel>;
