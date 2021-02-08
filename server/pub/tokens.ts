import { issueToken, verifyAndDecodeToken } from 'server/utils/tokens';

export const issueCreatePubToken = ({ userId, communityId, createInCollectionIds }) =>
	issueToken({
		userId,
		communityId,
		type: 'createPub',
		payload: { collectionIds: createInCollectionIds },
		expiresIn: 60 * 60, // seconds
	});

export const getValidCollectionIdsFromCreatePubToken = (token, { userId, communityId }) => {
	const result = verifyAndDecodeToken(token, {
		userId,
		communityId,
		type: 'createPub',
	});
	return result && result.payload.collectionIds;
};
