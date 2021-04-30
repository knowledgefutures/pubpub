import { getScope } from 'server/utils/queryHelpers';

const communitiesWithCustomScriptEnabled = [
	'6ffd8432-b3c1-4094-8ee1-a9de2e72cc27', // Commonplace
	'eb361ef0-d557-4cac-a949-8bd196e096e7', // Staging-place
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
