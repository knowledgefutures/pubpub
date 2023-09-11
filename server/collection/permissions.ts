import { getScope } from 'server/utils/queryHelpers';

export const collectionUpdatePremission = [
	'title',
	'slug',
	'isRestricted',
	'isPublic',
	'pageId',
	'metadata',
	'readNextPreviewSize',
	'layout',
	'layoutAllowsDuplicatePubs',
	'avatar',
] as const;

export const getPermissions = async ({
	userId = null,
	communityId = null,
	collectionId = null,
}: {
	userId?: string | null;
	communityId?: string | null;
	collectionId?: string | null;
}): Promise<Permissions> => {
	if (!userId) {
		return {};
	}
	const scopeData = await getScope({
		communityId,
		collectionId,
		loginId: userId,
	});
	const isAuthenticated = scopeData.activePermissions.canManage;
	if (!scopeData.elements.activeCollection) {
		return { create: isAuthenticated };
	}

	return {
		create: isAuthenticated,
		update: isAuthenticated ? collectionUpdatePremission : (false as const),
		destroy: isAuthenticated,
	};
};

export type Permissions = {
	create?: boolean;
	update?: false | typeof collectionUpdatePremission;
	destroy?: boolean;
};
