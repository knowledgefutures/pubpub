import { getScope } from 'server/utils/queryHelpers';

export const getPermissions = async ({ userId, pubId, accessHash, historyKey }) => {
	const {
		elements: { activePub },
		activePermissions: { canView, canViewDraft, canEdit },
	} = await getScope({
		pubId,
		loginId: userId,
		accessHash,
	});
	const isReleaseKey = activePub.releases.some((release) => release.historyKey === historyKey);
	return { canCreateExport: isReleaseKey || canView || canViewDraft, canRestoreHistory: canEdit };
};
