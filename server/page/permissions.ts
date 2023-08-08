import { Page } from 'server/models';
import { getScope } from 'server/utils/queryHelpers';

export const updatePermissions = [
	'title',
	'slug',
	'description',
	'isPublic',
	'layout',
	'layoutAllowsDuplicatePubs',
	'avatar',
	'isNarrowWidth',
] as const;

export const getPermissions = async ({
	userId,
	communityId,
	pageId,
}: {
	userId: string | null;
	communityId: string;
	pageId: string;
}) => {
	if (!userId) {
		return {};
	}
	const scopeData = await getScope({
		communityId,
		loginId: userId,
	});
	const isAuthenticated = scopeData.activePermissions.canManage;
	const pageData = await Page.findOne({ where: { id: pageId, communityId } });

	if (!pageData) {
		return { create: isAuthenticated };
	}

	return {
		create: isAuthenticated,
		update: isAuthenticated && updatePermissions,
		destroy: isAuthenticated,
	};
};

export type PagePermissions = {
	create?: boolean;
	update?: false | typeof updatePermissions;
	destroy?: boolean;
};
