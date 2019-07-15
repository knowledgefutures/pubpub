import { Branch, BranchPermission, PubManager, CommunityAdmin, Pub } from '../models';
import { getBranchAccess } from '../branch/permissions';

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
		Pub.findOne({ where: { id: pubId, communityId: communityId } }),
	]).then(
		([
			sourceBranchData,
			destinationBranchData,
			pubManagerData,
			communityAdminData,
			pubData,
		]) => {
			if (!pubData || !sourceBranchData || !destinationBranchData) {
				return {};
			}

			const destinationAccess = getBranchAccess(
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
		},
	);
};
