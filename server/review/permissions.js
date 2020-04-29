import { getScope } from '../utils/queryHelpers';

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

	/* TODO: We need some concept of 'Review Owner' for reviews with no */
	/* destinationBranch. Who is the one administrating the review, if not */
	/* the destination branch owner? Perhaps the review creator? */
	const { canManage, isPublicReviews, canAdmin } = scopeData.activePermissions;
	let editProps = [];
	if (canManage) {
		editProps = ['title', 'status', 'labels', 'releaseRequested'];
	}

	return {
		create: canManage || isPublicReviews,
		createRelease: canAdmin,
		update: editProps,
		destroy: canManage,
	};
};
