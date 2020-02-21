import { getScope, getMemberDataById } from '../utils/queryHelpers';

const getMemberBelongsToScope = async (scopeData, memberId) => {
	if (memberId) {
		const {
			elements: { activeIds, activeTargetType },
		} = scopeData;
		const member = await getMemberDataById(memberId, false);
		if (activeTargetType === 'community' && member.communityId === activeIds.communityId) {
			return true;
		}
		if (activeTargetType === 'collection' && member.collectionId === activeIds.collectionId) {
			return true;
		}
		if (activeTargetType === 'pub' && member.pubId === activeIds.pubId) {
			return true;
		}
	}
	return false;
};

export const getPermissions = async ({ actorId, pubId, communityId, collectionId, memberId }) => {
	if (!actorId) {
		return {};
	}

	const scopeData = await getScope({
		pubId: pubId,
		communityId: communityId,
		collectionId: collectionId,
		loginId: actorId,
	});

	const canManageScope = scopeData.activePermissions.canManage;
	const memberBelongsToScope = getMemberBelongsToScope(scopeData, memberId);

	return {
		create: canManageScope,
		update: canManageScope && memberBelongsToScope,
		destroy: canManageScope && memberBelongsToScope,
	};
};
