import { getScope } from 'server/utils/queryHelpers';

const editableFields = [
	'affiliation',
	'avatar',
	'isAuthor',
	'name',
	'orcid',
	'order',
	'roles',
	'title',
] as const;

export const getPermissions = async ({
	userId,
	communityId,
	collectionId,
}: {
	userId?: string;
	communityId: string;
	collectionId: string;
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
		return {};
	}
	return {
		create: isAuthenticated,
		update: isAuthenticated ? editableFields : false,
		destroy: isAuthenticated,
	};
};

export type Permissions = {
	create?: boolean;
	update?: false | typeof editableFields;
	destroy?: boolean;
};
