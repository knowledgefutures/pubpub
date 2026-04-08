import jwt from 'jsonwebtoken';

import { env } from 'server/env';

export const issueToken = ({ userId, communityId, type, payload, expiresIn }) => {
	const signingSecret = env.JWT_SIGNING_SECRET;

	if (userId && communityId && type && expiresIn) {
		return jwt.sign({ userId, communityId, type, payload }, signingSecret, {
			expiresIn,
		});
	}
	throw new Error('Refusing to create JWT without userId, communityId, type, and expiresIn');
};

export const verifyAndDecodeToken = (token, { userId, communityId, type }) => {
	const signingSecret = env.JWT_SIGNING_SECRET;

	try {
		jwt.verify(token, signingSecret);
	} catch (_) {
		return null;
	}
	const decodedValue = jwt.decode(token, { json: true });
	const {
		userId: claimedUserId,
		communityId: claimedCommunityId,
		type: claimedType,
	} = decodedValue ?? {};
	if (claimedUserId === userId && claimedCommunityId === communityId && claimedType === type) {
		return decodedValue;
	}
	return null;
};
