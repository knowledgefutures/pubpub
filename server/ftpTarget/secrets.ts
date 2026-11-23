import type { FtpTarget } from './model';

import { env } from 'server/env';
import { aes256Decrypt, aes256Encrypt } from 'utils/crypto';

const decrypt = (value: string | null, initVec: string | null) =>
	value && initVec ? aes256Decrypt(value, env.AES_ENCRYPTION_KEY!, initVec) : null;

/** The stored password and private key, decrypted. Either may be null. */
export const getFtpTargetSecrets = (
	target: Pick<FtpTarget, 'password' | 'passwordInitVec' | 'privateKey' | 'privateKeyInitVec'>,
) => ({
	password: decrypt(target.password, target.passwordInitVec),
	privateKey: decrypt(target.privateKey, target.privateKeyInitVec),
});

/**
 * Column updates that store one secret and clear the other: a target logs in with a password
 * or a key, never both.
 */
export const encryptFtpTargetSecret = (kind: 'password' | 'privateKey', plaintext: string) => {
	const { encryptedText, initVec } = aes256Encrypt(plaintext, env.AES_ENCRYPTION_KEY!);
	return kind === 'password'
		? {
				password: encryptedText,
				passwordInitVec: initVec,
				privateKey: null,
				privateKeyInitVec: null,
			}
		: {
				password: null,
				passwordInitVec: null,
				privateKey: encryptedText,
				privateKeyInitVec: initVec,
			};
};

export const clearedFtpTargetCredentials = {
	username: null,
	password: null,
	passwordInitVec: null,
	privateKey: null,
	privateKeyInitVec: null,
};

export const getFtpTargetAuthMethod = (
	target: Pick<FtpTarget, 'username' | 'password' | 'privateKey'>,
): 'key' | 'password' | null => {
	if (!target.username) return null;
	if (target.privateKey) return 'key';
	if (target.password) return 'password';
	return null;
};
