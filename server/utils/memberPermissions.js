import { Op } from 'sequelize';
import { Member } from '../models';

export const getMemberData = async (scopedData, userId) => {
	const {
		activePub,
		activeCollection,
		inactiveCollections,
		activeCommunity,
		activeOrganization,
	} = scopedData;

	const orQuery = [];
	orQuery.push({ communityId: activeCommunity.id });
	if (activePub) {
		orQuery.push({ pubId: activePub.id });
	}
	if (activeCollection || inactiveCollections.length) {
		orQuery.push({
			collectionId: {
				[Op.in]: [activeCollection, ...inactiveCollections].map((cl) => cl.id),
			},
		});
	}
	if (activeOrganization) {
		orQuery.push({ organizationId: activeOrganization.id });
	}

	return Member.findAll({
		where: {
			userId: userId,
			[Op.or]: orQuery,
		},
	});
};

export const getPublicPermissions = (scopedData) => {
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

export const getScopedPermissions = async (scopedData, userId) => {
	const memberData = await getMemberData(scopedData, userId);
	const { isPublic, isPublicDiscussion, isPublicReview } = getPublicPermissions(scopedData);
	const memberPermission = getPermissionLevel(memberData);

	return {
		isPublic: isPublic,
		isPublicDiscussion: isPublicDiscussion,
		isPublicReview: isPublicReview,
		memberPermission: memberPermission,
		memberData: memberData,
	};
};
