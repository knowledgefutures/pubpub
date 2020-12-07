import { getScope } from 'server/utils/queryHelpers';

export const getPermissions = async ({ branchId, userId, pubId, accessHash, communityId }) => {
	const {
		elements: { activePub },
		activePermissions: { canView },
	} = await getScope({
		communityId: communityId,
		pubId: pubId,
		loginId: userId,
		accessHash: accessHash,
	});

	const isPublicBranch = activePub.branches.some(
		(branch) => branch.id === branchId && branch.title === 'public',
	);

	return {
		create: canView || isPublicBranch,
	};
};
