import { Op } from 'sequelize';
import { Member } from '../models';

// export const buildMemberQueryOr = (scopeData) => {
// 	const {
// 		activePub,
// 		activeCollection,
// 		inactiveCollections,
// 		activeCommunity,
// 		activeOrganization,
// 	} = scopeData;

// 	const orQuery = [];
// 	orQuery.push({ communityId: activeCommunity.id });
// 	if (activePub) {
// 		orQuery.push({ pubId: activePub.id });
// 	}
// 	if (activeCollection || inactiveCollections.length) {
// 		const collectionsList = [...inactiveCollections];
// 		if (activeCollection) {
// 			collectionsList.push(activeCollection);
// 		}
// 		orQuery.push({
// 			collectionId: {
// 				[Op.in]: collectionsList.map((cl) => cl.id),
// 			},
// 		});
// 	}
// 	if (activeOrganization) {
// 		orQuery.push({ organizationId: activeOrganization.id });
// 	}
// 	return orQuery;
// };

// export const getMemberData = async (scopeData, userId) => {
// 	const orQuery = buildMemberQueryOr(scopeData);
// 	return Member.findAll({
// 		where: {
// 			userId: userId,
// 			[Op.or]: orQuery,
// 		},
// 	});
// };

// export const getPublicPermissions = (scopeData) => {
// 	const {
// 		activeCommunity,
// 		activeCollection,
// 		inactiveCollections,
// 		activePub,
// 		activeTargetType,
// 	} = scopeData;
// 	const booleanOr = (precedent, value) => {
// 		/* Don't inherit value from null */
// 		return typeof value === 'boolean' ? value : precedent;
// 	};
// 	const getCollectionValue = (key) => {
// 		return [...inactiveCollections, activeCollection]
// 			.filter((item) => item)
// 			.reduce((prev, curr) => {
// 				return prev || curr[key];
// 			}, null);
// 	};

// 	let isPublicBranches = activeCommunity.isPublicBranches || false;
// 	let isPublicDiscussions = activeCommunity.isPublicDiscussions || false;
// 	let isPublicReviews = activeCommunity.isPublicReviews || false;
// 	if (activeTargetType === 'collection') {
// 		isPublicBranches = booleanOr(isPublicBranches, activeCollection.isPublicBranches);
// 		isPublicDiscussions = booleanOr(isPublicDiscussions, activeCollection.isPublicDiscussions);
// 		isPublicReviews = booleanOr(isPublicReviews, activeCollection.isPublicReviews);
// 	}
// 	if (activeTargetType === 'pub') {
// 		const collectionIsPublicBranches = getCollectionValue('isPublicBranches');
// 		isPublicBranches = booleanOr(isPublicBranches, collectionIsPublicBranches);
// 		isPublicBranches = booleanOr(isPublicBranches, activePub.isPublicBranches);

// 		const collectionIsPublicDiscussions = getCollectionValue('isPublicDiscussions');
// 		isPublicDiscussions = booleanOr(isPublicDiscussions, collectionIsPublicDiscussions);
// 		isPublicDiscussions = booleanOr(isPublicDiscussions, activePub.isPublicDiscussions);

// 		const collectionIsPublicReviews = getCollectionValue('isPublicReviews');
// 		isPublicReviews = booleanOr(isPublicReviews, collectionIsPublicReviews);
// 		isPublicReviews = booleanOr(isPublicReviews, activePub.isPublicReviews);
// 	}
// 	return {
// 		isPublicBranches: isPublicBranches,
// 		isPublicDiscussions: isPublicDiscussions,
// 		isPublicReviews: isPublicReviews,
// 	};
// };

/* publicPermissions logic test structure */
// const scopeda = {
// 	activeCommunity: { isPublicBranches: null },
// 	activeCollection: { isPublicBranches: false },
// 	activePub: { isPublicBranches: null },
// 	activeTarget: { isPublicBranches: null },
// 	activeTargetType: 'pub',
// 	inactiveCollections: [{ isPublicBranches: true }, { isPublicBranches: null }, { isPublicBranches: null }],
// };
// console.log(getPublicPermissions(scopeda));

// export const getPermissionLevels = (memberData) => {
// 	const permissionLevels = ['view', 'edit', 'manage', 'admin'];
// 	const permissionLevelIndex = memberData.reduce((prev, curr) => {
// 		const currLevelIndex = permissionLevels.indexOf(curr.permissions);
// 		return currLevelIndex > prev ? currLevelIndex : prev;
// 	}, -1);

// 	return {
// 		memberPermission: permissionLevelIndex > -1 ? permissionLevels[permissionLevelIndex] : null,
// 		canView: permissionLevelIndex > -1,
// 		canEdit: permissionLevelIndex > 0,
// 		canManage: permissionLevelIndex > 1,
// 		canAdmin: permissionLevelIndex > 2,
// 	};
// };

/* Here scopeData needs to include activePub,
		activeCollection,
		inactiveCollections,
		activeCommunity,
		activeOrganization,*/
// export const getScopePermissions = async (scopeData, userId) => {
// 	// const memberData = await getMemberData(scopeData, userId);
// 	const { isPublicBranches, isPublicDiscussions, isPublicReviews } = getPublicPermissions(
// 		scopeData,
// 	);
// 	// const memberPermissions = getPermissionLevels(memberData);

// 	// return {
// 	// 	isPublicBranches: isPublicBranches,
// 	// 	isPublicDiscussions: isPublicDiscussions,
// 	// 	isPublicReviews: isPublicReviews,
// 	// 	memberData: memberData,
// 	// 	...memberPermissions,
// 	// };
// };
