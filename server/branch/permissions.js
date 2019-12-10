import { Branch, BranchPermission, PubManager, CommunityAdmin, Pub } from '../models';
import { checkIfSuperAdmin } from '../utils';

export const getBranchAccess = (accessHash, branchData, userId, isCommunityAdmin, canManagePub) => {
	const hasSomePermissionTo = (permission, shouldCheckPublic = true) => {
		return (
			checkIfSuperAdmin(userId) ||
			(isCommunityAdmin && branchData.communityAdminPermissions === permission) ||
			(canManagePub && branchData.pubManagerPermissions === permission) ||
			(shouldCheckPublic && branchData.publicPermissions === permission) ||
			branchData.permissions.some(
				(bp) => bp.userId === userId && bp.permissions === permission,
			)
		);
	};

	const canManageBranch = hasSomePermissionTo('manage', false);

	const isValidEditHash = accessHash === branchData.editHash;
	const canEditBranch = canManageBranch || isValidEditHash || hasSomePermissionTo('edit');

	const isValidDiscussHash = accessHash === branchData.discussHash;
	const canDiscussBranch = canEditBranch || isValidDiscussHash || hasSomePermissionTo('discuss');

	const isValidViewHash = accessHash === branchData.viewHash;
	const canViewBranch = canDiscussBranch || isValidViewHash || hasSomePermissionTo('view');

	/* TODO-BRANCH: This instance of conditional canEdit is only valid until */
	/* we roll out full branch features */
	return {
		canManage: !!canManageBranch,
		// canEdit: !!canEditBranch,
		canEdit: branchData.title !== 'public' && !!canEditBranch,
		canDiscuss: !!canDiscussBranch,
		canView: !!canViewBranch,
	};
};

export const getBranchAccessForUser = async ({ branchId, userId, accessHash }) => {
	const branchData = await Branch.findOne({
		where: { id: branchId },
		include: [
			{
				model: BranchPermission,
				as: 'permissions',
				required: false,
			},
		],
	});
	const pubData = await Pub.findOne({ where: { id: branchData.pubId } });
	const [pubManager, communityAdmin] = userId
		? await Promise.all([
				PubManager.findOne({
					where: { userId: userId, pubId: branchData.pubId },
					raw: true,
				}),
				CommunityAdmin.findOne({
					where: { userId: userId, communityId: pubData.communityId },
					raw: true,
				}),
		  ])
		: [null, null];
	return getBranchAccess(accessHash, branchData, userId, communityAdmin, pubManager);
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
		Pub.findOne({ where: { id: pubId, communityId: communityId } }),
	]).then(([branchData, pubManagerData, communityAdminData, pubData]) => {
		if (!branchData || !pubData) {
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
