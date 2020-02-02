import { getScopeData } from '../utils/scopeData';

export const getPermissions = async ({
	userId,
	communityId,
	pubId,
	sourceBranchId,
	destinationBranchId,
}) => {
	if (!userId || !communityId || !pubId || !sourceBranchId || !destinationBranchId) {
		return {};
	}
	const scopeData = await getScopeData({
		communityId: communityId,
		pubId: pubId,
		loginId: userId,
	});

	if (!scopeData.elements.activePub) {
		return {};
	}
	let sourceBranchExists = false;
	let destinationBranchExists = false;
	scopeData.elements.activePub.branches.forEach((branch) => {
		if (branch.id === sourceBranchId) {
			sourceBranchExists = true;
		}
		if (branch.id === destinationBranchId) {
			destinationBranchExists = true;
		}
	});
	if (!sourceBranchExists || !destinationBranchExists) {
		return {};
	}

	/* TODO: We need some concept of 'Review Owner' for reviews with no */
	/* destinationBranch. Who is the one administrating the review, if not */
	/* the destination branch owner? Perhaps the review creator? */
	const { canManage, isPublicReviews } = scopeData.activePermissions;
	let editProps = [];
	if (canManage) {
		editProps = ['isClosed', 'isCompleted'];
	}

	return {
		create: canManage || isPublicReviews,
		update: editProps,
		destroy: canManage,
	};
};
