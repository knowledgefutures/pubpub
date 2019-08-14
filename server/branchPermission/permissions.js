import { Branch, BranchPermission, PubManager, CommunityAdmin, Pub } from '../models';
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
		Pub.findOne({ where: { id: pubId, communityId: communityId } }),
	]).then(([branchData, pubManagerData, communityAdminData, pubData]) => {
		if (!branchData || !pubData) {
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
			create: canManage,
			update: canManage && ['permissions'],
			destroy: canManage,
		};
	});
};
