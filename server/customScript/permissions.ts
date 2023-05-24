import { getFeatureFlagForUserAndCommunity } from 'server/featureFlag/queries';
import { getScope } from 'server/utils/queryHelpers';

export const canSetCustomScript = async ({
	userId,
	communityId,
	type,
}: {
	userId: string;
	communityId: string;
	type: string;
}) => {
	const customScriptsEnabled = await getFeatureFlagForUserAndCommunity(
		null,
		communityId,
		'customScripts',
	);
	if (type === 'js' && !customScriptsEnabled) {
		return false;
	}
	const {
		activePermissions: { canAdminCommunity },
	} = await getScope({ communityId, loginId: userId });
	return canAdminCommunity;
};
