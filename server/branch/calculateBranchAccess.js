import { checkIfSuperAdmin } from '../utils';

export default (accessHash, branchData, userId, communityAdminData, canManagePub) => {
	const hasSomePermissionTo = (permission, shouldCheckPublic = true) =>
		checkIfSuperAdmin(userId) ||
		(communityAdminData && branchData.communityAdminPermissions === permission) ||
		(canManagePub && branchData.pubManagerPermissions === permission) ||
		(shouldCheckPublic && branchData.publicPermissions === permission) ||
		branchData.permissions.some((bp) => bp.userId === userId && bp.permissions === permission);

	/* Compute canManageBranch */
	const canManageBranch = hasSomePermissionTo('manage', false);

	/* Compute canEditBranch */
	const isValidEditHash = accessHash === branchData.editHash;
	const canEditBranch = canManageBranch || isValidEditHash || hasSomePermissionTo('edit');

	/* Compute canDiscussBranch */
	const isValidDiscussHash = accessHash === branchData.discussHash;
	const canDiscussBranch = canEditBranch || isValidDiscussHash || hasSomePermissionTo('discuss');

	/* Compute canViewBranch */
	const isValidViewHash = accessHash === branchData.viewHash;
	const canViewBranch = canDiscussBranch || isValidViewHash || hasSomePermissionTo('view');

	return {
		canManage: canManageBranch,
		canEdit: canEditBranch,
		canDiscuss: canDiscussBranch,
		canView: canViewBranch,
	};
};
