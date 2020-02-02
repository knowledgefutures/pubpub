import { getScopeData } from '../utils/scopeData';

export const getPermissions = async ({ userId, communityId, collectionId }) => {
	if (!userId) {
		return {};
	}
	const scopeData = await getScopeData({
		communityId: communityId,
		collectionId: collectionId,
		loginId: userId,
	});
	const isAuthenticated = scopeData.activePermissions.canManage;
	if (!scopeData.elements.activeCollection) {
		return {};
	}
	return {
		create: isAuthenticated,
		update: isAuthenticated ? ['rank', 'contextHint'] : false,
		setPrimary: isAuthenticated,
		destroy: isAuthenticated,
	};
};
