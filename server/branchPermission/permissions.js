import { Branch, BranchPermission, PubManager, CommunityAdmin } from '../models';
import { checkIfSuperAdmin } from '../utils';

export const getPermissions = ({ branchId, userId, pubId, communityId }) => {
	if (!userId || !communityId || !pubId) {
		return new Promise((resolve) => {
			resolve({});
		});
	}

	const isSuperAdmin = checkIfSuperAdmin(userId);
	return Promise.all([
		Branch.findOne({
			where: { id: branchId },
			include: [
				{
					model: BranchPermission,
					as: 'permissions',
					required: false,
				},
			],
		}),
		PubManager.findOne({ where: { pubId: pubId, userId: userId } }),
		CommunityAdmin.findOne({ where: { communityId: communityId, userId: userId } }),
	]).then(([branchData, pubManagerData, communityAdminData]) => {
		if (!branchData) {
			return {};
		}

		/* calculate canManage */
		const canManageAsPubManager =
			branchData.pubManagerPermissions === 'manage' && pubManagerData;
		const canManageAsCommunityAdmin =
			branchData.communityAdminPermissions === 'manage' && communityAdminData;
		const canManage = branchData.permissions.reduce((prev, curr) => {
			if (curr.userId === userId && curr.permissions === 'manage') {
				return true;
			}
			return prev;
		}, canManageAsPubManager || canManageAsCommunityAdmin || isSuperAdmin);

		return {
			create: true,
			update: canManage && ['permissions'],
			destroy: canManage,
		};
	});
};
