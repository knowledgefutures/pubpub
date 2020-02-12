import { getScope } from '../utils/queryHelpers';

export const getPermissions = async ({ userId, communityId, collectionId }) => {
	if (!userId) {
		return {};
	}
	const scopeData = await getScope({
		communityId: communityId,
		collectionId: collectionId,
		loginId: userId,
	});
	const isAuthenticated = scopeData.activePermissions.canManage;
	if (!scopeData.elements.activeCollection) {
		return {};
	}
	const editProps = ['name', 'avatar', 'title', 'order', 'isAuthor', 'roles', 'affiliation'];
	return {
		create: isAuthenticated,
		update: isAuthenticated ? editProps : false,
		destroy: isAuthenticated,
	};
};
