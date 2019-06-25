import { Branch, BranchPermission, PubManager, CommunityAdmin } from '../models';
import { checkIfSuperAdmin } from '../utils';

export const getBranchAccess = (accessHash, branchData, userId, isCommunityAdmin, canManagePub) => {
	const hasSomePermissionTo = (permission, shouldCheckPublic = true) =>
		checkIfSuperAdmin(userId) ||
		(isCommunityAdmin && branchData.communityAdminPermissions === permission) ||
		(canManagePub && branchData.pubManagerPermissions === permission) ||
		(shouldCheckPublic && branchData.publicPermissions === permission) ||
		branchData.permissions.some((bp) => bp.userId === userId && bp.permissions === permission);

	/* Compute canManageBranch */
	const canManageBranch = hasSomePermissionTo('manage', false);

	const isValidEditHash = accessHash === branchData.editHash;
	const canEditBranch = canManageBranch || isValidEditHash || hasSomePermissionTo('edit');

	const isValidDiscussHash = accessHash === branchData.discussHash;
	const canDiscussBranch = canEditBranch || isValidDiscussHash || hasSomePermissionTo('discuss');

	const isValidViewHash = accessHash === branchData.viewHash;
	const canViewBranch = canDiscussBranch || isValidViewHash || hasSomePermissionTo('view');

	return {
		canManage: canManageBranch,
		canEdit: canEditBranch,
		canDiscuss: canDiscussBranch,
		canView: canViewBranch,
	};
};

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
		const branchAccess = getBranchAccess(
			null,
			branchData,
			userId,
			communityAdminData,
			pubManagerData,
		);

		const baseEdit = [
			'title',
			'description',
			'submissionAlias',
			'order',
			'pubManagerPermissions',
			'communityAdminPermissions',
		];
		const fullEdit = [...baseEdit, 'publicPermissions'];
		const editProps =
			isSuperAdmin || communityAdminData || pubManagerData ? fullEdit : baseEdit;

		return {
			create: true,
			update: branchAccess.canManage && editProps,
			destroy: branchAccess.canManage,
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
