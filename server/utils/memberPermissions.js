import { Op } from 'sequelize';
import { Community, Collection, CollectionPub, Member, Pub } from '../models';

export const getMemberData = async (userId, targetId, targetType) => {
	let pubId;
	let collectionId;
	let communityId;
	let organizationId;
	if (targetType === 'pub') {
		const targetData = await Pub.findOne({
			where: { id: targetId },
			attributes: ['id', 'communityId'],
			include: [
				{
					model: CollectionPub,
					as: 'collectionPubs',
					required: false,
					attributes: ['id', 'pubId', 'collectionId'],
				},
				{
					model: Community,
					as: 'community',
					attributes: ['id', 'organizationId'],
				},
			],
		});

		pubId = targetId;
		collectionId = { [Op.in]: targetData.collectionPubs.map((cp) => cp.collectionId) };
		communityId = targetData.community.id;
		organizationId = targetData.community.organizationId;
	}
	if (targetType === 'collection') {
		const targetData = await Collection.findOne({
			where: { id: targetId },
			attributes: ['id', 'communityId'],
			include: [
				{
					model: Community,
					as: 'community',
					attributes: ['id', 'organizationId'],
				},
			],
		});

		collectionId = targetId;
		communityId = targetData.community.id;
		organizationId = targetData.community.organizationId;
	}
	if (targetType === 'community') {
		const targetData = await Community.findOne({
			where: { id: targetId },
			attributes: ['id', 'organizationId'],
		});

		communityId = targetId;
		organizationId = targetData.organizationId;
	}
	if (targetType === 'organization') {
		organizationId = targetId;
	}

	const orQuery = [];
	orQuery.push({ communityId: communityId });
	if (pubId) {
		orQuery.push({ pubId: pubId });
	}
	if (collectionId) {
		orQuery.push({ collectionId: collectionId });
	}
	if (organizationId) {
		orQuery.push({ organizationId: organizationId });
	}

	return Member.findAll({
		where: {
			userId: userId,
			[Op.or]: orQuery,
		},
	});
};

export const getLevel = async (membersData) => {
	const permissionLevels = ['view', 'edit', 'manage', 'admin'];
	const permissionLevelIndex = membersData.reduce((prev, curr) => {
		const currLevelIndex = permissionLevels.indexOf(curr.permissions);
		return currLevelIndex > prev ? currLevelIndex : prev;
	}, -1);

	return permissionLevelIndex > -1 ? permissionLevels[permissionLevelIndex] : null;
};

/* TODO: We likely need something here that gets isPublic, isPublicDiscussion, isPublicReview */
/* for the whole hierarchy */

export const getMemberLevel = async ({ userId, targetId, targetType }) => {
	const membersData = await getMemberData(userId, targetId, targetType);
	const level = getLevel(membersData);
	return level;
};
