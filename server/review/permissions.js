import { Branch, BranchPermission, PubManager, CommunityAdmin } from '../models';
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
	]).then(([sourceBranchData, destinationBranchData, pubManagerData, communityAdminData]) => {
		if (!sourceBranchData || !destinationBranchData) {
			return {};
		}

		const sourceAccess = getBranchAccess(
			null,
			sourceBranchData,
			userId,
			communityAdminData,
			pubManagerData,
		);
		const destinationAccess = getBranchAccess(
			null,
			destinationBranchData,
			userId,
			communityAdminData,
			pubManagerData,
		);

		/* TODO: We need some concept of 'Review Owner' for reviews with no */
		/* destinationBranch. Who is the one administrating the review, if not */
		/* the destination branch owner? Perhaps the review creator? */
		let editProps = [];
		if (sourceAccess.canManage) {
			editProps = ['isClosed'];
		}
		if (destinationAccess.canManage) {
			editProps = ['isClosed', 'isCompleted'];
		}

		return {
			create: sourceAccess.canManage,
			update: editProps,
			destroy: sourceAccess.canManage,
		};
	});
};
