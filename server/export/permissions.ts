import { getScope } from 'server/utils/queryHelpers';

export const getPermissions = async ({ userId, pubId, historyKey, accessHash, communityId }) => {
	const {
		elements: { activePub },
		activePermissions: { canView },
	} = await getScope({
		communityId,
		pubId,
		loginId: userId,
		accessHash,
	});
	const isReleaseKey = activePub.releases.some((release) => release.historyKey === historyKey);
	return { create: canView || isReleaseKey };
};
