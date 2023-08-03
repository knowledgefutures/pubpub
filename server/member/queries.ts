import { Op } from 'sequelize';

import * as types from 'types';
import { CollectionPub, Member } from 'server/models';
import { getMemberDataById } from 'server/utils/queryHelpers';
import { MemberPermission } from 'types';

const assertExactlyOneScopeInTarget = ({ pubId, communityId, collectionId }: any) => {
	if ([pubId, communityId, collectionId].filter((x) => x).length !== 1) {
		throw new Error('Cannot create member with ambiguous scope.');
	}
};

type CreateMemberOptions = {
	target: {
		userId: string;
		communityId?: string;
		collectionId?: string;
		pubId?: string;
	};
	value: { permissions: MemberPermission };
	actorId?: string | null;
};

export const createMember = async ({
	target: { pubId, collectionId, communityId, userId },
	value: { permissions },
	actorId = null,
}: CreateMemberOptions) => {
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
		{ returning: ['id'], actorId },
	);
	return getMemberDataById(memberId);
};

type UpdateMemberOptions = {
	memberId: string;
	actorId: string | null;
	value: Partial<{
		permissions: ['view', 'edit', 'manage', 'admin'];
		subscribedToActivityDigest: boolean;
	}>;
};

export const updateMember = async (options: UpdateMemberOptions) => {
	const {
		memberId,
		actorId,
		value: { permissions, subscribedToActivityDigest },
	} = options;
	const existingMember = await Member.findOne({ where: { id: memberId } });
	await existingMember.update({ permissions, subscribedToActivityDigest }, { actorId });
	return existingMember;
};

export const destroyMember = ({ memberId, actorId = null }) => {
	return Member.destroy({ where: { id: memberId }, actorId, individualHooks: true });
};

export const getMembersForScope = async (
	scope: types.ScopeId,
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

type IsUserMemberOfScopeOptions = {
	userId: null | string;
	scope: types.ScopeId;
};

export const isUserMemberOfScope = async (options: IsUserMemberOfScopeOptions) => {
	const { userId, scope } = options;
	if (!userId) {
		return false;
	}
	const membersOfScope = await getMembersForScope(scope);
	return membersOfScope.some((member) => member.userId === userId);
};
