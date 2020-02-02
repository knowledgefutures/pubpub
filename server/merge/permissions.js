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

	const editProps = scopeData.activePermissions.canManage ? ['note'] : [];

	return {
		create: scopeData.activePermissions.canManage,
		update: editProps,
		destroy: false,
	};
};
