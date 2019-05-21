/* eslint-disable prettier/prettier */
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

		const sourceAccess = calculateBranchAccess(
				null,
				sourceBranchData,
				userId,
				communityAdminData,
				pubManagerData,
			);
		const destinationAccess = calculateBranchAccess(
				null,
				destinationBranchData,
				userId,
				communityAdminData,
				pubManagerData,
			);


		const baseEdit = [
			'isClosed',
		];
		const editProps =
			sourceAccess.canManage || destinationAccess.canManage ? baseEdit : [];

		return {
			create: sourceAccess.canManage,
			accept: destinationAccess.canManage,
			update: editProps,
			destroy: sourceAccess.canManage,
		};
	});
};
