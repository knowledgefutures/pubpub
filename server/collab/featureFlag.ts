import { FeatureFlag, FeatureFlagCommunity } from 'server/models';

const PITTER_PATTER_FLAG_NAME = 'pitterPatterCollab';

/**
 * Check if Pitter Patter collab is enabled for a given community.
 * Uses the existing FeatureFlag system for gradual rollout.
 *
 * During migration:
 *  - Create a FeatureFlag named "pitterPatterCollab"
 *  - Add specific communities via FeatureFlagCommunity to opt them in
 *  - Or set enabledCommunitiesFraction to 1.0 to enable globally
 *
 * When the flag does not exist, Pitter Patter is assumed to be enabled
 * (post-migration default).
 */
export const isPitterPatterEnabled = async (communityId: string): Promise<boolean> => {
	const flag = await FeatureFlag.findOne({
		where: { name: PITTER_PATTER_FLAG_NAME },
		include: [{ model: FeatureFlagCommunity, as: 'communities' }],
	});

	// if no flag exists, the migration is complete and everyone uses Pitter Patter
	if (!flag) {
		return true;
	}

	// check if the community is explicitly opted in
	const communityOptedIn = flag.communities?.some((fc) => fc.communityId === communityId);

	if (communityOptedIn) {
		return true;
	}

	// check fraction-based rollout
	if (flag.enabledCommunitiesFraction && flag.enabledCommunitiesFraction >= 1.0) {
		return true;
	}

	return false;
};
