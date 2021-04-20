import { getScope } from 'server/utils/queryHelpers';

const communitiesWithCustomScriptEnabled = [
	'e164d5cb-585e-4170-bad8-10d09e08d1bc', // Contours
	'0417b0c0-cd38-48bd-8a84-b0b95da98813', // Demo
];

export const communityCanUseCustomScripts = (communityId: string) => {
	return communitiesWithCustomScriptEnabled.includes(communityId);
};

export const canSetCustomScript = async ({
	userId,
	communityId,
}: {
	userId: string;
	communityId: string;
}) => {
	if (!communityCanUseCustomScripts(communityId)) {
		return false;
	}
	const {
		activePermissions: { canAdminCommunity },
	} = await getScope({ communityId, loginId: userId });
	return canAdminCommunity;
};
