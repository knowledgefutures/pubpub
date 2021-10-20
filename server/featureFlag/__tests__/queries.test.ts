/* global describe, it, expect, beforeAll */
import { modelize, setup } from 'stubstub';

import { getFeatureFlagForUserAndCommunity, getFeatureFlagsForUserAndCommunity } from '../queries';

const createUuidForFraction = (frac: number) => {
	const prefix = '00000000-0000-0000-0000-';
	const suffix = Math.round(0xffffffffffff * frac)
		.toString(16)
		.padStart(12, '0');
	return prefix + suffix;
};

const expectFeatureFlagsToMatch = async (user: any, community: any, match: Record<string, any>) => {
	const flags = await getFeatureFlagsForUserAndCommunity(user?.id, community?.id);
	expect(flags).toMatchObject(match);
};

const models = modelize`
    FeatureFlag bees {
        name: "bees"
    }
    FeatureFlag trees {
        id: ${createUuidForFraction(0.25)}
        name: "trees"
        enabledUsersFraction: 0.9
    }
	FeatureFlag knees {
		id: ${createUuidForFraction(0)}
		name: "knees"
		enabledCommunitiesFraction: 0.5
	}
    Community c1 {
        FeatureFlagCommunity {
            featureFlag: bees
            enabled: true
        }
		id: ${createUuidForFraction(0.49)}
    }
    Community c2 {
		id: ${createUuidForFraction(0.51)}
	}
    User u0 {
        id: ${createUuidForFraction(0.5)}
    }
    User u1 {
        id: ${createUuidForFraction(0.74)}
    }
    User u2 {
        FeatureFlagUser {
            featureFlag: bees
            enabled: false
        }
    }
	User u3 {
        id: ${createUuidForFraction(0.739)}
		FeatureFlagUser {
			featureFlag: trees
			enabled: true
		}
    }
`;

setup(beforeAll, models.resolve);

describe('getFeatureFlagsForUserAndCommunity', () => {
	it('allow FeatureFlagCommunity to enable flags for communities that would otherwise be disabled', async () => {
		const { u1, c1, c2 } = models;
		await Promise.all([
			expectFeatureFlagsToMatch(u1, c1, { bees: true }),
			expectFeatureFlagsToMatch(u1, c2, { bees: false }),
		]);
	});

	it('allows FeatureFlagUser to enable flags for users whose IDs would put otherwise disable them', async () => {
		const { u1, u3, c1 } = models;
		await Promise.all([
			expectFeatureFlagsToMatch(u1, c1, { trees: false }),
			expectFeatureFlagsToMatch(u3, c1, { trees: true }),
		]);
	});

	it('disables a flag if any overrides have enabled=false', async () => {
		const { u1, u2, c1 } = models;
		await Promise.all([
			expectFeatureFlagsToMatch(u1, c1, { bees: true }),
			expectFeatureFlagsToMatch(u2, c1, { bees: false }),
		]);
	});

	it('predictably buckets users based on UUIDs in the absence of overrides', async () => {
		const { u0, u1, c1 } = models;
		await Promise.all([
			expectFeatureFlagsToMatch(u0, c1, { trees: true }),
			expectFeatureFlagsToMatch(u1, c1, { trees: false }),
		]);
	});

	it('predictably buckets communities based on UUIDs in the absence of overrides', async () => {
		const { u0, c1, c2 } = models;
		await Promise.all([
			expectFeatureFlagsToMatch(u0, c1, { knees: true }),
			expectFeatureFlagsToMatch(u0, c2, { knees: false }),
		]);
	});

	it('works when user and community are null', async () => {
		await expectFeatureFlagsToMatch(null, null, { bees: false, knees: false, trees: false });
	});
});

describe('getFeatureFlagForUser', () => {
	it('returns expected values for a single feature flag', async () => {
		const { u1, c1, c2 } = models;
		expect(await getFeatureFlagForUserAndCommunity(u1.id, c1.id, 'bees')).toBe(true);
		expect(await getFeatureFlagForUserAndCommunity(u1.id, c2.id, 'bees')).toBe(false);
	});

	it('returns expected values for another feature flag', async () => {
		const { u0, u1, c1 } = models;
		expect(await getFeatureFlagForUserAndCommunity(u0.id, c1.id, 'trees')).toBe(true);
		expect(await getFeatureFlagForUserAndCommunity(u1.id, c1.id, 'trees')).toBe(false);
	});
});
