import { Op } from 'sequelize';
import { Member } from '../models';

export const buildMemberQueryOr = (scopeData) => {
	const {
		activePub,
		activeCollection,
		inactiveCollections,
		activeCommunity,
		activeOrganization,
	} = scopeData;

	const orQuery = [];
	orQuery.push({ communityId: activeCommunity.id });
	if (activePub) {
		orQuery.push({ pubId: activePub.id });
	}
	if (activeCollection || inactiveCollections.length) {
		const collectionsList = [...inactiveCollections];
		if (activeCollection) {
			collectionsList.push(activeCollection);
		}
		orQuery.push({
			collectionId: {
				[Op.in]: collectionsList.map((cl) => cl.id),
			},
		});
	}
	if (activeOrganization) {
		orQuery.push({ organizationId: activeOrganization.id });
	}
	return orQuery;
};

export const getMemberData = async (scopeData, userId) => {
	const orQuery = buildMemberQueryOr(scopeData);
	return Member.findAll({
		where: {
			userId: userId,
			[Op.or]: orQuery,
		},
	});
};

export const getPublicPermissions = (scopeData) => {
	// TODO
	return {};
};

export const getPermissionLevel = (memberData) => {
	const permissionLevels = ['view', 'edit', 'manage', 'admin'];
	const permissionLevelIndex = memberData.reduce((prev, curr) => {
		const currLevelIndex = permissionLevels.indexOf(curr.permissions);
		return currLevelIndex > prev ? currLevelIndex : prev;
	}, -1);

	return permissionLevelIndex > -1 ? permissionLevels[permissionLevelIndex] : null;
};

export const getScopePermissions = async (scopeData, userId) => {
	const memberData = await getMemberData(scopeData, userId);
	const { isPublic, isPublicDiscussion, isPublicReview } = getPublicPermissions(scopeData);
	const memberPermission = getPermissionLevel(memberData);

	return {
		isPublic: isPublic,
		isPublicDiscussion: isPublicDiscussion,
		isPublicReview: isPublicReview,
		memberPermission: memberPermission,
		memberData: memberData,
	};
};
