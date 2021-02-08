import { getScope, getMemberDataById } from 'server/utils/queryHelpers';

const getMemberPermission = async (scopeData, memberId) => {
	if (memberId) {
		const {
			elements: { activeIds, activeTargetType },
		} = scopeData;
		const member = await getMemberDataById(memberId, false);
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
	// @ts-expect-error ts-migrate(2525) FIXME: Initializer provides no value for this binding ele... Remove this comment to see the full error message
	value: { permissions } = {},
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
