import { getBranchAccessForUser } from '../branch/permissions';

export const getPermissions = async ({ branchId, userId, accessHash }) => {
	const branchAccess = await getBranchAccessForUser({
		branchId: branchId,
		userId: userId,
		accessHash: accessHash,
	});
	return {
		create: branchAccess.canView,
	};
};
