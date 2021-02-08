import jwt from 'jsonwebtoken';

export const issueToken = ({ userId, communityId, type, payload, expiresIn }) => {
	if (userId && communityId && type && expiresIn) {
		return jwt.sign({ userId, communityId, type, payload }, process.env.JWT_SIGNING_SECRET, {
			expiresIn,
		});
	}
	throw new Error('Refusing to create JWT without userId, communityId, type, and expiresIn');
};

export const verifyAndDecodeToken = (token, { userId, communityId, type }) => {
	try {
		jwt.verify(token, process.env.JWT_SIGNING_SECRET);
	} catch (_) {
		return null;
	}
	const decodedValue = jwt.decode(token);
	const {
		userId: claimedUserId,
		communityId: claimedCommunityId,
		type: claimedType,
	} = decodedValue;
	if (claimedUserId === userId && claimedCommunityId === communityId && claimedType === type) {
		return decodedValue;
	}
	return null;
};
