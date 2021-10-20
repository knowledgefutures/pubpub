/* global describe, it, expect, beforeAll */
import { modelize, setup } from 'stubstub';

import { FeatureFlag, FeatureFlagCommunity, FeatureFlagUser } from 'server/models';

import { createFeatureFlag, getFeatureFlag, destroyFeatureFlag } from '../interface';

const models = modelize`
    FeatureFlag fleets {
        name: "fleets"
    }
    Community c1 {}
    User u1 {}
`;

setup(beforeAll, models.resolve);

describe('feature flags devshell interface', () => {
	it('creates a FeatureFlag', async () => {
		const ff = await createFeatureFlag('foo');
		expect(await FeatureFlag.findOne({ where: { name: 'foo' } })).toMatchObject({ id: ff.id });
	});

	it('prevents the creation of duplicate FeatureFlags', async () => {
		expect(() => createFeatureFlag('foo'));
	});

	it('destroys a FeatureFlag', async () => {
		await destroyFeatureFlag('foo');
		expect(await FeatureFlag.findOne({ where: { name: 'foo' } })).toBeNull();
	});

	it('sets and retrieves an enabledUsersFraction', async () => {
		const { fleets } = models;
		const flag = await getFeatureFlag('fleets');
		await flag.setEnabledUsersFraction(0.25);
		expect(await fleets.reload()).toMatchObject({ enabledUsersFraction: 0.25 });
		expect(await flag.getEnabledUsersFraction()).toEqual(0.25);
	});

	it('sets and retrieves an enabledCommunitiesFraction', async () => {
		const { fleets } = models;
		const flag = await getFeatureFlag('fleets');
		await flag.setEnabledCommunitiesFraction(0.55);
		expect(await fleets.reload()).toMatchObject({ enabledCommunitiesFraction: 0.55 });
		expect(await flag.getEnabledCommunitiesFraction()).toEqual(0.55);
	});

	it('adds and removes an override for a Community', async () => {
		const { c1, fleets } = models;
		const flag = await getFeatureFlag('fleets');
		await flag.setCommunityOverride(c1.subdomain, 'off');
		expect(
			await FeatureFlagCommunity.findOne({
				where: { featureFlagId: fleets.id, communityId: c1.id },
			}),
		).toMatchObject({ enabled: false });
		expect(await flag.getCommunityOverrideStates()).toMatchObject({ [c1.subdomain]: 'off' });
		await flag.removeCommunityOverride(c1.subdomain);
		expect(
			await FeatureFlagCommunity.findOne({
				where: { featureFlagId: fleets.id, communityId: c1.id },
			}),
		).toBeNull();
	});

	it('adds and removes an override for a User', async () => {
		const { u1, fleets } = models;
		const flag = await getFeatureFlag('fleets');
		await flag.setUserOverride(u1.slug, 'on');
		expect(
			await FeatureFlagUser.findOne({
				where: { featureFlagId: fleets.id, userId: u1.id },
			}),
		).toMatchObject({ enabled: true });
		expect(await flag.getUserOverrideStates()).toMatchObject({ [u1.slug]: 'on' });
		await flag.removeUserOverride(u1.slug);
		expect(
			await FeatureFlagUser.findOne({
				where: { featureFlagId: fleets.id, userId: u1.id },
			}),
		).toBeNull();
	});
});
