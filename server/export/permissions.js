import { getScopeData } from '../utils/scopeData';

export const getPermissions = async ({ branchId, userId, pubId, accessHash, communityId }) => {
	const scopeData = await getScopeData({
		communityId: communityId,
		pubId: pubId,
		loginId: userId,
		accessHash: accessHash,
	});
	const isPublicBranch = scopeData.elements.activePub.branches.reduce((prev, curr) => {
		if (curr.title === 'public' && curr.id === branchId) {
			return true;
		}
		return prev;
	}, false);

	return {
		create: scopeData.activePermissions.canView || isPublicBranch,
	};
};
