import crypto from 'crypto';

export const AUTH_TOKEN_PREFIX = 'pubpub_pat_';

/**
 * Auth tokens are opaque, 32-byte random strings. They carry ~256 bits of
 * entropy, so a fast hash (SHA-256) is sufficient at rest — bcrypt/argon2 are
 * only needed when the input is low-entropy (passwords). SHA-256 is also fast
 * enough to run on every authenticated API request.
 */
export const hashAuthToken = (raw: string): string =>
	crypto.createHash('sha256').update(raw).digest('hex');

export const generateAuthToken = () => {
	const raw = `${AUTH_TOKEN_PREFIX}${crypto.randomBytes(32).toString('base64url')}`;
	return {
		raw,
		hashedToken: hashAuthToken(raw),
		lastFour: raw.slice(-4),
	};
};
