import { getScope } from 'server/utils/queryHelpers';

export const getPermissions = async ({ userId, communityId, pubId }) => {
	if (!userId || !communityId || !pubId) {
		return {};
	}
	const scopeData = await getScope({
		communityId: communityId,
		pubId: pubId,
		loginId: userId,
	});

	if (!scopeData.elements.activePub) {
		return {};
	}

	const { canAdmin, canCreateReviews, canManage } = scopeData.activePermissions;

	let editProps = [];
	if (canManage) {
		editProps = ['title', 'status', 'labels', 'releaseRequested'];
	}

	return {
		create: canCreateReviews,
		createRelease: canAdmin,
		update: editProps,
		destroy: canManage,
	};
};
