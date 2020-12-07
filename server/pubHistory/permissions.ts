import { getScope } from 'server/utils/queryHelpers';

export const getPermissions = async ({ userId, communityId, pubId, branchId, accessHash }) => {
	const {
		elements: { activePub },
		activePermissions: { canView, canViewDraft },
	} = await getScope({
		pubId: pubId,
		communityId: communityId,
		loginId: userId,
		accessHash: accessHash,
	});

	const isRelease =
		activePub.releases.length > 0 &&
		activePub.branches.some((branch) => branch.title === 'public' && branch.id === branchId);

	return { canCreateExport: isRelease || canView || canViewDraft };
};
