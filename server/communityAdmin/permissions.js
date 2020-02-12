import { getScope } from '../utils/queryHelpers';

export const getPermissions = async ({ userId, communityId }) => {
	if (!userId) {
		return {};
	}
	const scopeData = await getScope({
		communityId: communityId,
		loginId: userId,
	});

	return {
		create: scopeData.activePermissions.canAdmin,
		destroy: scopeData.activePermissions.canAdmin,
	};
};
