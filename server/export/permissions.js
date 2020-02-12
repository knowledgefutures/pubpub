import { getScope } from '../utils/queryHelpers';

export const getPermissions = async ({ branchId, userId, pubId, accessHash, communityId }) => {
	const scopeData = await getScope({
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
	}, scopeData.activePermissions.isPublicBranches);

	return {
		create: scopeData.activePermissions.canView || isPublicBranch,
	};
};
