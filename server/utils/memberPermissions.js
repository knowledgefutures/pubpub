import { Op } from 'sequelize';
import { Community, Collection, CollectionPub, Member, Organization, Pub } from '../models';

export const getPermissionLevel = async ({ userId, targetId, targetType }) => {
	let pubId;
	let collectionId;
	let communityId;
	let organizationId;
	let publicPermissionLevel = -1;
	const permissionLevels = ['view', 'discuss', 'edit', 'manage', 'admin'];

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
		publicPermissionLevel = Math.max(
			publicPermissionLevel,
			permissionLevels.indexOf(targetData.publicPermissions),
		);
		pubId = targetId;
		collectionId = { [Op.in]: targetData.collectionPubs.map((cp) => cp.collectionId) };
		communityId = targetData.community.id;
		organizationId = targetData.community.organizationId;
		// whereQuery.push({ pubId: targetId });
		// whereQuery.push({
		// 	collectionId: { $in: targetData.collectionPubs.map((cp) => cp.collectionId) },
		// });
		// whereQuery.push({ communityId: targetData.community.id });
		// whereQuery.push({ organizationId: targetData.community.organizationId });

		// whereQuery.pubId = targetId;
		// whereQuery.collectionId = { $in: targetData.collectionPubs.map((cp) => cp.collectionId) };
		// whereQuery.communityId = targetData.community.id;
		// whereQuery.organizationId = targetData.community.organizationId;
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
		publicPermissionLevel = Math.max(
			publicPermissionLevel,
			permissionLevels.indexOf(targetData.publicPermissions),
		);
		collectionId = targetId;
		communityId = targetData.community.id;
		organizationId = targetData.community.organizationId;
	}
	if (targetType === 'community') {
		const targetData = await Community.findOne({
			where: { id: targetId },
			attributes: ['id', 'organizationId'],
		});
		publicPermissionLevel = Math.max(
			publicPermissionLevel,
			permissionLevels.indexOf(targetData.publicPermissions),
		);
		communityId = targetId;
		organizationId = targetData.organizationId;
	}
	if (targetType === 'organization') {
		const targetData = await Organization.findOne({
			where: { id: targetId },
			attributes: ['id', 'organizationId'],
		});
		publicPermissionLevel = Math.max(
			publicPermissionLevel,
			permissionLevels.indexOf(targetData.publicPermissions),
		);
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

	const memberships = await Member.findAll({
		where: {
			userId: userId,
			[Op.or]: orQuery,
		},
	});

	const permissionLevelIndex = memberships.reduce((prev, curr) => {
		const currLevelIndex = permissionLevels.indexOf(curr.permissions);
		return currLevelIndex > prev ? currLevelIndex : prev;
	}, publicPermissionLevel);

	return permissionLevelIndex > -1 ? permissionLevels[permissionLevelIndex] : null;
};
