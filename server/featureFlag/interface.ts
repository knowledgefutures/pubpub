import type { FeatureFlagOverrideState } from 'types';

import {
	createFeatureFlag as createRawFeatureFlag,
	destroyFeatureFlag as destroyRawFeatureFlag,
	getFeatureFlagById,
	getFeatureFlagByName,
	setFeatureFlagEnabledCommunitiesFraction,
	setFeatureFlagEnabledUsersFraction,
} from 'server/featureFlag/queries';
import { setFeatureFlagOverrideForCommunity } from 'server/featureFlagCommunity/queries';
import { setFeatureFlagOverrideForUser } from 'server/featureFlagUser/queries';
import { Community, FeatureFlagCommunity, FeatureFlagUser, User } from 'server/models';
import { expect } from 'utils/assert';

type OverrideValues =
	| Record<string, FeatureFlagOverrideState>
	| [string[], FeatureFlagOverrideState];

const resolveOverrideValues = (
	overrideValues: OverrideValues,
): [string, FeatureFlagOverrideState][] => {
	if (Array.isArray(overrideValues)) {
		const [identifier, state] = overrideValues;
		return identifier.map((id) => [id, state]);
	}
	return Object.entries(overrideValues);
};

const getUserBySlug = (slug: string) => User.findOne({ where: { slug } });
const getCommunityBySubdomain = (subdomain: string) => Community.findOne({ where: { subdomain } });

class FeatureFlagInterface {
	readonly id: string;
	readonly name: string;

	constructor(id: string, name: string) {
		this.id = id;
		this.name = name;
	}

	async setEnabledCommunitiesFraction(fraction: number) {
		await setFeatureFlagEnabledCommunitiesFraction(this.id, fraction);
	}

	async setEnabledUsersFraction(fraction: number) {
		await setFeatureFlagEnabledUsersFraction(this.id, fraction);
	}

	async getEnabledCommunitiesFraction() {
		const featureFlag = await getFeatureFlagById(this.id);
		return featureFlag!.enabledCommunitiesFraction;
	}

	async getEnabledUsersFraction() {
		const featureFlag = await getFeatureFlagById(this.id);
		return featureFlag!.enabledUsersFraction;
	}

	async updateUserOverrides(slugs: OverrideValues) {
		await Promise.all(
			resolveOverrideValues(slugs).map(async ([slug, state]) => {
				const user = await getUserBySlug(slug);
				if (user) {
					await setFeatureFlagOverrideForUser(this.id, user.id, state);
				}
			}),
		);
	}

	async updateCommunityOverrides(subdomains: OverrideValues) {
		await Promise.all(
			resolveOverrideValues(subdomains).map(async ([subdomain, state]) => {
				const community = await getCommunityBySubdomain(subdomain);
				if (community) {
					await setFeatureFlagOverrideForCommunity(this.id, community.id, state);
				}
			}),
		);
	}

	async setCommunityOverride(subdomain: string, state: FeatureFlagOverrideState) {
		await this.updateCommunityOverrides({ [subdomain]: state });
	}

	async removeCommunityOverride(subdomain: string) {
		await this.setCommunityOverride(subdomain, 'inert');
	}

	async setUserOverride(slug: string, state: FeatureFlagOverrideState) {
		await this.updateUserOverrides({ [slug]: state });
	}

	async removeUserOverride(slug: string) {
		await this.setUserOverride(slug, 'inert');
	}

	async getCommunityOverrideStates() {
		const states: Record<string, FeatureFlagOverrideState> = {};
		const communityOverrides = await FeatureFlagCommunity.findAll({
			where: { featureFlagId: this.id },
		});
		await Promise.all(
			communityOverrides.map(async (override) => {
				const community = expect(
					await Community.findOne({
						where: { id: expect(override.communityId) },
					}),
				);
				states[community.subdomain] = override.enabled ? 'on' : 'off';
			}),
		);
		return states;
	}

	async getUserOverrideStates() {
		const states: Record<string, FeatureFlagOverrideState> = {};
		const userOverrides = await FeatureFlagUser.findAll({
			where: { featureFlagId: this.id },
		});
		await Promise.all(
			userOverrides.map(async (override) => {
				const user = expect(await User.findOne({ where: { id: expect(override.userId) } }));
				states[user.slug] = override.enabled ? 'on' : 'off';
			}),
		);
		return states;
	}
}

export const createFeatureFlag = async (name: string) => {
	const featureFlag = await createRawFeatureFlag(name);
	return new FeatureFlagInterface(featureFlag.id, expect(featureFlag.name));
};

export const getFeatureFlag = async (name: string) => {
	const featureFlag = expect(await getFeatureFlagByName(name, true));
	return new FeatureFlagInterface(featureFlag.id, expect(featureFlag.name));
};

export const destroyFeatureFlag = async (name: string) => {
	const featureFlag = await getFeatureFlagByName(name, true);
	await destroyRawFeatureFlag(expect(featureFlag).id);
};
