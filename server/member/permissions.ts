import type { MemberPermission } from 'types';

import { getMemberDataById, getScope } from 'server/utils/queryHelpers';
import { expect } from 'utils/assert';

const getMemberPermission = async (scopeData, memberId?: string) => {
	if (memberId) {
		const {
			elements: { activeIds, activeTargetType },
		} = scopeData;
		const member = expect(await getMemberDataById(memberId, false));
		if (activeTargetType === 'community' && member.communityId === activeIds.communityId) {
			return member.permissions;
		}
		if (activeTargetType === 'collection' && member.collectionId === activeIds.collectionId) {
			return member.permissions;
		}
		if (activeTargetType === 'pub' && member.pubId === activeIds.pubId) {
			return member.permissions;
		}
	}
	return false;
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
