import * as types from 'types';
import { FeatureFlag, FeatureFlagUser, FeatureFlagCommunity } from 'server/models';

import { isFeatureFlagEnabledForUserInCommunity } from './helpers';

const throwExists = (name: string) => {
	throw new Error(`Feature flag already exists: ${name}`);
};

const throwDoesNotExist = (name: string) => {
	throw new Error(`Feature flag does not exist: ${name}`);
};

export const getFeatureFlagById = (
	id: string,
): Promise<null | types.SequelizeModel<types.FeatureFlag>> =>
	FeatureFlag.findOne({ where: { id } });

export const getFeatureFlagByName = async (name: string, expectExists: null | boolean = null) => {
	const flag = await FeatureFlag.findOne({ where: { name } });
	if (expectExists === false && flag) {
		throwExists(name);
	}
	if (expectExists === true && !flag) {
		throwDoesNotExist(name);
	}
	return flag;
};

export const createFeatureFlag = async (name: string) => {
	await getFeatureFlagByName(name, false);
	return FeatureFlag.create({ name });
};

export const destroyFeatureFlag = async (id: string) => {
	await FeatureFlag.destroy({ where: { id } });
};

export const setFeatureFlagEnabledCommunitiesFraction = async (id: string, fraction: number) => {
	const flag = await getFeatureFlagById(id);
	if (flag) {
		flag.enabledCommunitiesFraction = fraction;
		await flag.save();
	} else {
		throwDoesNotExist(id);
	}
};

export const setFeatureFlagEnabledUsersFraction = async (id: string, fraction: number) => {
	const flag = await getFeatureFlagById(id);
	if (flag) {
		flag.enabledUsersFraction = fraction;
		await flag.save();
	} else {
		throwDoesNotExist(id);
	}
};

export const getFeatureFlagsForUserAndCommunity = async (
	userId: null | string,
	communityId: null | string,
) => {
	const [featureFlags, featureFlagUsers, featureFlagCommunities] = await Promise.all([
		FeatureFlag.findAll(),
		userId ? FeatureFlagUser.findAll({ where: { userId } }) : [],
		communityId ? FeatureFlagCommunity.findAll({ where: { communityId } }) : [],
	]);
	const flags: Record<string, boolean> = {};
	featureFlags.forEach((featureFlag) => {
		flags[featureFlag.name] = isFeatureFlagEnabledForUserInCommunity({
			userId,
			communityId,
			featureFlag,
			featureFlagCommunities,
			featureFlagUsers,
		});
	});
	return flags;
};

export const getFeatureFlagForUserAndCommunity = async (
	userId: null | string,
	communityId: null | string,
	flagName: string,
) => {
	const featureFlag = await getFeatureFlagByName(flagName, true);
	const [featureFlagUsers, featureFlagCommunities] = await Promise.all([
		userId ? FeatureFlagUser.findAll({ where: { userId } }) : [],
		communityId ? FeatureFlagCommunity.findAll({ where: { communityId } }) : [],
	]);
	return isFeatureFlagEnabledForUserInCommunity({
		userId,
		communityId,
		featureFlag,
		featureFlagUsers,
		featureFlagCommunities,
	});
};
