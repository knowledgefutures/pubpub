import { getScopeData } from '../utils/scopeData';

export const getPermissions = async ({ userId, communityId }) => {
	if (!userId) {
		return {};
	}
	const scopeData = await getScopeData({
		communityId: communityId,
		loginId: userId,
	});

	return {
		create: scopeData.activePermissions.canAdmin,
		destroy: scopeData.activePermissions.canAdmin,
	};
};
