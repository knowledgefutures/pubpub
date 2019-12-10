import { Op } from 'sequelize';
import { Community, Collection, CollectionPub, Member, Pub } from '../models';

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
	//

	// if (activePub) {
	// 	pubId =
	// }
	// const collectionIds = [activeCollection, ...inactiveCollections].map((cl) => cl.id );
	// if ()

	// if (targetType === 'pub') {
	// 	const targetData = await Pub.findOne({
	// 		where: { id: targetId },
	// 		attributes: ['id', 'communityId'],
	// 		include: [
	// 			{
	// 				model: CollectionPub,
	// 				as: 'collectionPubs',
	// 				required: false,
	// 				attributes: ['id', 'pubId', 'collectionId'],
	// 			},
	// 			{
	// 				model: Community,
	// 				as: 'community',
	// 				attributes: ['id', 'organizationId'],
	// 			},
	// 		],
	// 	});

	// 	pubId = targetId;
	// 	collectionId = { [Op.in]: targetData.collectionPubs.map((cp) => cp.collectionId) };
	// 	communityId = targetData.community.id;
	// 	organizationId = targetData.community.organizationId;
	// }
	// if (targetType === 'collection') {
	// 	const targetData = await Collection.findOne({
	// 		where: { id: targetId },
	// 		attributes: ['id', 'communityId'],
	// 		include: [
	// 			{
	// 				model: Community,
	// 				as: 'community',
	// 				attributes: ['id', 'organizationId'],
	// 			},
	// 		],
	// 	});

	// 	collectionId = targetId;
	// 	communityId = targetData.community.id;
	// 	organizationId = targetData.community.organizationId;
	// }
	// if (targetType === 'community') {
	// 	const targetData = await Community.findOne({
	// 		where: { id: targetId },
	// 		attributes: ['id', 'organizationId'],
	// 	});

	// 	communityId = targetId;
	// 	organizationId = targetData.organizationId;
	// }
	// if (targetType === 'organization') {
	// 	organizationId = targetId;
	// }

	// const orQuery = [];
	// orQuery.push({ communityId: communityId });
	// if (pubId) {
	// 	orQuery.push({ pubId: pubId });
	// }
	// if (collectionId) {
	// 	orQuery.push({ collectionId: collectionId });
	// }
	// if (organizationId) {
	// 	orQuery.push({ organizationId: organizationId });
	// }

	console.log('here', orQuery);
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
