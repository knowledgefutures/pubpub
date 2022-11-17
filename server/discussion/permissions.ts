import { Discussion, Pub } from 'server/models';
import * as types from 'types';
import { getScope } from 'server/utils/queryHelpers';
import { getFeatureFlagForUserAndCommunity } from 'server/featureFlag/queries';

export const getCreatePermission = async ({
	userId,
	pubId,
	communityId,
	accessHash,
	visibilityAccess,
	commentAccessHash,
}) => {
	if (!userId && !commentAccessHash) {
		return false;
	}

	const pub: types.Pub = await Pub.findOne({ where: { id: pubId } });
	const hasAccessHash = pub?.commentHash === commentAccessHash;
	const scopeData = await getScope({
		communityId,
		pubId,
		loginId: userId,
		accessHash,
	});

	const { canView, canCreateDiscussions } = scopeData.activePermissions;
	const nonMembersVisibility = visibilityAccess && visibilityAccess !== 'members';
	return canView || (canCreateDiscussions && nonMembersVisibility) || hasAccessHash;
};

export const getUpdatePermissions = async ({ discussionId, userId, pubId, communityId }) => {
	if (!userId) {
		return {};
	}

	const {
		activePermissions: { canAdmin },
	} = await getScope({
		communityId,
		pubId,
		loginId: userId,
	});

	const discussionData = await Discussion.findOne({
		where: { id: discussionId, pubId },
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

export const canReleaseDiscussions = async ({
	userId,
	pubId,
}: {
	userId: string;
	pubId: string;
}) => {
	const {
		elements: {
			activeCommunity: { id: communityId },
		},
		activePermissions: { canManage },
	} = await getScope({ pubId, loginId: userId });
	const isEnabled = await getFeatureFlagForUserAndCommunity(
		userId,
		communityId,
		'releaseDiscussionsDialog',
	);
	return canManage && isEnabled;
};
