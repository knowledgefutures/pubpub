import { getScope } from 'server/utils/queryHelpers';

export const getPermissions = async ({ userId, pubId, historyKey, accessHash, communityId }) => {
	const {
		elements: { activePub },
		activePermissions: { canView },
	} = await getScope({
		communityId: communityId,
		pubId: pubId,
		loginId: userId,
		accessHash: accessHash,
	});
	const isReleaseKey = activePub.releases.some((release) => release.historyKey === historyKey);
	return { create: canView || isReleaseKey };
};
