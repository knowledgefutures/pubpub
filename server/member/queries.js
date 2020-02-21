import { Member } from '../models';
import { getMemberDataById } from '../utils/queryHelpers';

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
		pubId: pubId,
		communityId: communityId,
		collectionId: collectionId,
	});
	const { id: memberId } = await Member.create(
		{
			userId: userId,
			permissions: permissions,
			communityId: communityId,
			collectionId: collectionId,
			pubId: pubId,
		},
		{ returning: ['id'] },
	);
	return getMemberDataById(memberId);
};

export const updateMember = ({ memberId, value: { permissions } }) => {
	return Member.update({ permissions: permissions }, { where: { id: memberId } });
};

export const destroyMember = ({ memberId }) => {
	return Member.destroy({ where: { id: memberId } });
};
