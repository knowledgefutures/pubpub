import type { MemberPermission } from 'types';

import { NotFoundError } from 'server/utils/errors';
import { getMemberDataById, getScope } from 'server/utils/queryHelpers';

/** The member's current level, provided they belong to the scope the request is for */
const getMemberPermission = async (scopeData, memberId?: string) => {
	if (!memberId) {
		return false;
	}
	const {
		elements: { activeIds, activeTargetType },
	} = scopeData;
	const member = await getMemberDataById(memberId, false);
	const isInScope =
		!!member &&
		((activeTargetType === 'community' && member.communityId === activeIds.communityId) ||
			(activeTargetType === 'collection' && member.collectionId === activeIds.collectionId) ||
			(activeTargetType === 'pub' && member.pubId === activeIds.pubId));
	if (!isInScope) {
		throw new NotFoundError();
	}
	return member.permissions;
};

export const getPermissions = async ({
	actorId,
	pubId,
	communityId,
	collectionId,
	memberId,
	value: { permissions } = { permissions: undefined },
}: {
	actorId?: string | null;
	pubId?: string | null;
	communityId?: string;
	collectionId?: string | null;
	memberId?: string;
	value?: {
		permissions?: MemberPermission;
	};
}) => {
	if (!actorId) {
		return {};
	}

	const scopeData = await getScope({
		pubId,
		communityId,
		collectionId,
		loginId: actorId,
	});

	const canAdminScope = scopeData.activePermissions.canAdmin;
	const canManageScope = scopeData.activePermissions.canManage;
	const prevMemberPermission = await getMemberPermission(scopeData, memberId);
	const isUpdatingToAdmin = permissions === 'admin';
	const isUpdatingAdmin = prevMemberPermission === 'admin';

	return {
		create: canAdminScope || (canManageScope && !isUpdatingToAdmin),
		update: canAdminScope || (canManageScope && !isUpdatingToAdmin && !isUpdatingAdmin),
		destroy: canAdminScope || (canManageScope && !isUpdatingAdmin),
	};
};
