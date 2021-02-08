import { Member } from 'server/models';
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
