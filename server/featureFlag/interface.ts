import { FeatureFlagOverrideState } from 'types';
import { setFeatureFlagOverrideForCommunity } from 'server/featureFlagCommunity/queries';
import { setFeatureFlagOverrideForUser } from 'server/featureFlagUser/queries';
import {
	createFeatureFlag as createRawFeatureFlag,
	destroyFeatureFlag as destroyRawFeatureFlag,
	getFeatureFlagById,
	getFeatureFlagByName,
	setFeatureFlagEnabledUsersFraction,
	setFeatureFlagEnabledCommunitiesFraction,
} from 'server/featureFlag/queries';
import { User, Community, FeatureFlagCommunity, FeatureFlagUser } from 'server/models';

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
				const community = await Community.findOne({ where: { id: override.communityId } });
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
				const user = await User.findOne({ where: { id: override.userId } });
				states[user.slug] = override.enabled ? 'on' : 'off';
			}),
		);
		return states;
	}
}

export const createFeatureFlag = async (name: string) => {
	const featureFlag = await createRawFeatureFlag(name);
	return new FeatureFlagInterface(featureFlag.id, featureFlag.name);
};

export const getFeatureFlag = async (name: string) => {
	const featureFlag = await getFeatureFlagByName(name, true);
	return new FeatureFlagInterface(featureFlag.id, featureFlag.name);
};

export const destroyFeatureFlag = async (name: string) => {
	const featureFlag = await getFeatureFlagByName(name, true);
	await destroyRawFeatureFlag(featureFlag.id);
};
