import { getScope } from 'server/utils/queryHelpers';

export const getPermissions = async ({
	userId,
	communityId,
	pubId,
	threadId,
}: {
	userId?: string;
	communityId?: string;
	pubId?: string;
	threadId?: string;
}): Promise<ThreadEventPermissions> => {
	if (!userId || !communityId || !pubId || !threadId) {
		return {} as ThreadEventPermissions;
	}
	const scopeData = await getScope({
		communityId,
		pubId,
		loginId: userId,
	});

	const { activePub } = scopeData.elements;
	if (!activePub || activePub.id !== pubId) {
		return {} as ThreadEventPermissions;
	}

	const threadParent = [activePub.discussions, activePub.reviews].flat().find((item) => {
		return item?.threadId === threadId;
	});
	if (!threadParent) {
		return {} as ThreadEventPermissions;
	}

	const { canManage } = scopeData.activePermissions;

	return {
		create: canManage,
		update: false,
		destroy: false,
	};
};

export type ThreadEventPermissions = {
	create?: boolean;
	update?: false;
	destroy?: false;
};
