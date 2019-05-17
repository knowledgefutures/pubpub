/* eslint-disable prettier/prettier */
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
			return { create: true };
		}

		/* calculate canManage */
		const canManageAsPubManager = branchData.pubManagerPermissions === 'manage' && pubManagerData;
		const canManageAsCommunityAdmin = branchData.communityAdminPermissions === 'manage' && communityAdminData;
		const canManage = branchData.permissions.reduce((prev, curr) => {
			if (curr.userId === userId && curr.permissions === 'manage') {
				return true;
			}
			return prev;
		}, canManageAsPubManager || canManageAsCommunityAdmin || isSuperAdmin);

		const baseEdit = [
			'title',
			'description',
			'submissionAlias',
			'order',
			'pubManagerPermissions',
			'communityAdminPermissions',
		];
		const fullEdit = [...baseEdit, 'publicPermissions'];
		const editProps = isSuperAdmin || communityAdminData || pubManagerData 
			? fullEdit
			: baseEdit;

		return {
			create: true,
			update: canManage && editProps,
			destroy: canManage, 
		};
	});
};

/* Calculate - we'll probably use this code in pubAuthenticate eventually */
/* calculate canEdit */
// const canEditAsPubManager = branchData.pubManagerPermissions === 'edit' && pubManagerData;
// const canEditAsCommunityAdmin = branchData.communityAdminPermissions === 'edit' && communityAdminData;
// const canEditAsPublic = branchData.publicPermissions === 'edit';
// const canEdit = branchData.permissions.reduce((prev, curr) => {
// 	if (curr.userId === userId && curr.permissions === 'edit') {
// 		return true;
// 	}
// 	return prev;
// }, canManage || canEditAsPubManager || canEditAsCommunityAdmin || canEditAsPublic);

// /* calculate canDiscuss */
// const canDiscussAsPubManager = branchData.pubManagerPermissions === 'discuss' && pubManagerData;
// const canDiscussAsCommunityAdmin = branchData.communityAdminPermissions === 'discuss' && communityAdminData;
// const canDiscussAsPublic = branchData.publicPermissions === 'discuss';
// const canDiscuss = branchData.permissions.reduce((prev, curr) => {
// 	if (curr.userId === userId && curr.permissions === 'discuss') {
// 		return true;
// 	}
// 	return prev;
// }, canManage || canEdit || canDiscussAsPubManager || canDiscussAsCommunityAdmin || canDiscussAsPublic);

// /* calculate canView */
// const canViewAsPubManager = branchData.pubManagerPermissions === 'view' && pubManagerData;
// const canViewAsCommunityAdmin = branchData.communityAdminPermissions === 'view' && communityAdminData;
// const canViewAsPublic = branchData.publicPermissions === 'view';
// const canView = branchData.permissions.reduce((prev, curr) => {
// 	if (curr.userId === userId && curr.permissions === 'view') {
// 		return true;
// 	}
// 	return prev;
// }, canManage || canEdit || canDiscuss || canViewAsPubManager || canViewAsCommunityAdmin || canViewAsPublic);
