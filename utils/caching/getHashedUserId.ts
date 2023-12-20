import crypto from 'crypto';

export const getHashedUserId = (user: { id: string; salt: string }) =>
	crypto.pbkdf2Sync(user.id, user.salt, 1000, 64, `sha512`).toString(`hex`);

export const getPPLic = (user: { id: string; salt: string }) => `pp-li-${getHashedUserId(user)}`;
