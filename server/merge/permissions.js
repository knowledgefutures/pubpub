import { Branch, BranchPermission, PubManager, CommunityAdmin } from '../models';
import calculateBranchAccess from '../branch/calculateBranchAccess';

export const getPermissions = ({
	userId,
	communityId,
	pubId,
	sourceBranchId,
	destinationBranchId,
}) => {
	if (!userId || !communityId || !pubId) {
		return new Promise((resolve) => {
			resolve({});
		});
	}

	const findBranch = (branchId) => {
		return Branch.findOne({
			where: { id: branchId },
			include: [
				{
					model: BranchPermission,
					as: 'permissions',
					required: false,
				},
			],
		});
	};
	return Promise.all([
		findBranch(sourceBranchId),
		findBranch(destinationBranchId),
		PubManager.findOne({ where: { pubId: pubId, userId: userId } }),
		CommunityAdmin.findOne({ where: { communityId: communityId, userId: userId } }),
	]).then(([sourceBranchData, destinationBranchData, pubManagerData, communityAdminData]) => {
		if (!sourceBranchData || !destinationBranchData) {
			return {};
		}

		const destinationAccess = calculateBranchAccess(
			null,
			destinationBranchData,
			userId,
			communityAdminData,
			pubManagerData,
		);

		const editProps = destinationAccess.canManage ? ['note'] : [];

		return {
			create: destinationAccess.canManage,
			update: editProps,
			destroy: false,
		};
	});
};
