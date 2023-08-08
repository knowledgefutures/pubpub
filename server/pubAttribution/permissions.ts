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
	pubId,
}: {
	userId?: string;
	communityId: string;
	pubId: string;
}): Promise<Permissions> => {
	if (!userId) {
		return {} as Permissions;
	}

	const {
		activePermissions: { canManage },
	} = await getScope({
		communityId,
		pubId,
		loginId: userId,
	});

	return {
		create: canManage,
		update: canManage ? editableFields : false,
		destroy: canManage,
	};
};

export type Permissions = {
	create?: boolean;
	update?: typeof editableFields | false;
	destroy?: boolean;
};
