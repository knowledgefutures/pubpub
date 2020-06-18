import { getScope } from 'server/utils/queryHelpers';

export const getPermissions = async ({ userId, communityId, pubId, threadId }) => {
	if (!userId || !communityId || !pubId || !threadId) {
		return {};
	}
	const scopeData = await getScope({
		communityId: communityId,
		pubId: pubId,
		loginId: userId,
	});

	const { activePub } = scopeData.elements;
	if (!activePub || activePub.id !== pubId) {
		return {};
	}

	const threadParent = [activePub.discussions, activePub.forks, activePub.reviews].find(
		(item) => {
			return item.threadId === threadId;
		},
	);
	if (!threadParent) {
		return {};
	}

	const { canManage } = scopeData.activePermissions;

	return {
		create: canManage,
		update: false,
		destroy: false,
	};
};
