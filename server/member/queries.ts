import { Op } from 'sequelize';

import * as types from 'types';
import { CollectionPub, Member } from 'server/models';
import { getMemberDataById } from 'server/utils/queryHelpers';

const assertExactlyOneScopeInTarget = ({ pubId, communityId, collectionId }) => {
	if ([pubId, communityId, collectionId].filter((x) => x).length !== 1) {
		throw new Error('Cannot create member with ambiguous scope.');
	}
};

export const createMember = async ({
	target: { pubId, collectionId, communityId, userId },
	value: { permissions },
}) => {
	assertExactlyOneScopeInTarget({
		pubId,
		communityId,
		collectionId,
	});
	const { id: memberId } = await Member.create(
		{
			userId,
			permissions,
			communityId,
			collectionId,
			pubId,
		},
		{ returning: ['id'] },
	);
	return getMemberDataById(memberId);
};

export const updateMember = async ({ memberId, value: { permissions } }) => {
	const existingMember = await Member.findOne({ where: { id: memberId } });
	await existingMember.update({ permissions });
	return existingMember;
};

export const destroyMember = ({ memberId }) => {
	return Member.destroy({ where: { id: memberId } });
};

export const getMembersForScope = async (
	scope: types.Scope,
): Promise<types.SequelizeModel<types.Member>[]> => {
	if ('pubId' in scope && scope.pubId) {
		const collectionPubs = await CollectionPub.findAll({
			where: { pubId: scope.pubId },
			attributes: ['collectionId'],
		});
		return Member.findAll({
			where: {
				[Op.or]: [
					{ communityId: scope.communityId },
					{ collectionId: { [Op.in]: collectionPubs.map((cp) => cp.collectionId) } },
					{ pubId: scope.pubId },
				],
			},
		});
	}
	if ('collectionId' in scope && scope.collectionId) {
		return Member.findAll({
			where: {
				[Op.or]: [{ communityId: scope.communityId }, { collectionId: scope.collectionId }],
			},
		});
	}
	return Member.findAll({ where: { communityId: scope.communityId } });
};
