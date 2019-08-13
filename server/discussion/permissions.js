import { Discussion, Pub, CommunityAdmin, PubManager, Branch, BranchPermission } from '../models';
import { getBranchAccess } from '../branch/permissions';

const userEditableFields = ['title', 'content', 'text', 'isArchived', 'highlights', 'labels'];

export const getPermissions = async ({
	branchId,
	discussionId,
	pubId,
	userId,
	communityId,
	discussHash,
}) => {
	if (!userId) {
		return {};
	}

	const [discussionOnBranch, branch, pub, pubManager, communityAdmin] = await Promise.all([
		discussionId &&
			Discussion.findOne({
				where: { id: discussionId, branchId: branchId },
				raw: true,
			}),
		Branch.findOne({
			where: { id: branchId, pubId: pubId },
			include: [
				{
					model: BranchPermission,
					as: 'permissions',
					required: false,
				},
			],
		}),
		Pub.findOne({ where: { id: pubId, communityId: communityId }, raw: true }),
		PubManager.findOne({
			where: { userId: userId, pubId: pubId },
			raw: true,
		}),
		CommunityAdmin.findOne({
			where: { userId: userId, communityId: communityId },
			raw: true,
		}),
	]);

	const { canManage, canDiscuss } = await getBranchAccess(
		discussHash,
		branch,
		userId,
		pub && communityAdmin,
		pub && pubManager,
	);

	const userCreatedDiscussion = discussionOnBranch && discussionOnBranch.userId === userId;

	return {
		create: canDiscuss,
		update: (canManage || !!userCreatedDiscussion) && userEditableFields,
	};
};
