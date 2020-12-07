import { Page } from 'server/models';
import { getScope } from 'server/utils/queryHelpers';

export const getPermissions = async ({ userId, communityId, pageId }) => {
	if (!userId) {
		return {};
	}
	const scopeData = await getScope({
		communityId: communityId,
		loginId: userId,
	});
	const isAuthenticated = scopeData.activePermissions.canManage;
	const pageData = await Page.findOne({ where: { id: pageId, communityId: communityId } });

	if (!pageData) {
		return { create: isAuthenticated };
	}
	const editProps = [
		'title',
		'slug',
		'description',
		'isPublic',
		'layout',
		'avatar',
		'isNarrowWidth',
	];

	return {
		create: isAuthenticated,
		update: isAuthenticated && editProps,
		destroy: isAuthenticated,
	};
};
