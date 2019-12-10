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
	const {
		activeCommunity,
		activeCollection,
		inactiveCollections,
		activePub,
		activeTargetType,
	} = scopeData;
	const booleanOr = (precedent, value) => {
		/* Don't inherit value from null */
		return typeof value === 'boolean' ? value : precedent;
	};
	const getCollectionValue = (key) => {
		return [...inactiveCollections, activeCollection]
			.filter((item) => item)
			.reduce((prev, curr) => {
				return prev || curr[key];
			}, null);
	};

	let isPublic = activeCommunity.isPublic || false;
	let isPublicDiscussion = activeCommunity.isPublicDiscussion || false;
	let isPublicReview = activeCommunity.isPublicReview || false;
	if (activeTargetType === 'collection') {
		isPublic = booleanOr(isPublic, activeCollection.isPublic);
		isPublicDiscussion = booleanOr(isPublicDiscussion, activeCollection.isPublicDiscussion);
		isPublicReview = booleanOr(isPublicReview, activeCollection.isPublicReview);
	}
	if (activeTargetType === 'pub') {
		const collectionIsPublic = getCollectionValue('isPublic');
		isPublic = booleanOr(isPublic, collectionIsPublic);
		isPublic = booleanOr(isPublic, activePub.isPublic);

		const collectionIsPublicDiscussion = getCollectionValue('isPublicDiscussion');
		isPublicDiscussion = booleanOr(isPublicDiscussion, collectionIsPublicDiscussion);
		isPublicDiscussion = booleanOr(isPublicDiscussion, activePub.isPublicDiscussion);

		const collectionIsPublicReview = getCollectionValue('isPublicReview');
		isPublicReview = booleanOr(isPublicReview, collectionIsPublicReview);
		isPublicReview = booleanOr(isPublicReview, activePub.isPublicReview);
	}
	return {
		isPublic: isPublic,
		isPublicDiscussion: isPublicDiscussion,
		isPublicReview: isPublicReview,
	};
};

/* publicPermissions logic test structure */
// const scopeda = {
// 	activeCommunity: { isPublic: null },
// 	activeCollection: { isPublic: false },
// 	activePub: { isPublic: null },
// 	activeTarget: { isPublic: null },
// 	activeTargetType: 'pub',
// 	inactiveCollections: [{ isPublic: true }, { isPublic: null }, { isPublic: null }],
// };
// console.log(getPublicPermissions(scopeda));

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
