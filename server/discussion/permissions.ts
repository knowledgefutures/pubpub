import { DiscussionNew } from 'server/models';
import { getScope } from 'server/utils/queryHelpers';

export const getCreatePermission = async ({
	userId,
	pubId,
	communityId,
	accessHash,
	visibilityAccess,
}) => {
	if (!userId) {
		return false;
	}

	const scopeData = await getScope({
		communityId: communityId,
		pubId: pubId,
		loginId: userId,
		accessHash: accessHash,
	});

	const { canView, canCreateDiscussions } = scopeData.activePermissions;
	const nonMembersVisibility = visibilityAccess && visibilityAccess !== 'members';
	return canView || (canCreateDiscussions && nonMembersVisibility);
};

export const getUpdatePermissions = async ({ discussionId, userId, pubId, communityId }) => {
	if (!userId) {
		return {};
	}

	const {
		activePermissions: { canAdmin },
	} = await getScope({
		communityId: communityId,
		pubId: pubId,
		loginId: userId,
	});

	const discussionData = await DiscussionNew.findOne({
		where: { id: discussionId, pubId: pubId },
	});

	const isAuthor = discussionData.userId === userId;
	const hasBasicPermissions = isAuthor || canAdmin;

	return {
		canTitle: hasBasicPermissions,
		canApplyPublicLabels: hasBasicPermissions,
		canApplyManagedLabels: canAdmin,
		canClose: hasBasicPermissions,
		canReopen: canAdmin,
	};
};
