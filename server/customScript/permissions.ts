import { getScope } from 'server/utils/queryHelpers';
import { communityCanUseCustomScripts } from 'utils/customScripts';

export const canSetCustomScript = async ({
	userId,
	communityId,
	type,
}: {
	userId: string;
	communityId: string;
	type: string;
}) => {
	if (type === 'js' && !communityCanUseCustomScripts(communityId)) {
		return false;
	}
	const {
		activePermissions: { canAdminCommunity },
	} = await getScope({ communityId, loginId: userId });
	return canAdminCommunity;
};
