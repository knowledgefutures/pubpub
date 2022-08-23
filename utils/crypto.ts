import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export const aes256Encrypt = (
	text: string,
	key: string,
	initVec: string = randomBytes(16).toString('hex'),
) => {
	const cipher = createCipheriv(
		'aes-256-cbc',
		Buffer.from(key, 'hex'),
		Buffer.from(initVec, 'hex'),
	);
	const encrypted = cipher.update(text);
	const encryptedBuffer = Buffer.concat([encrypted, cipher.final()]);
	return { initVec, encryptedText: encryptedBuffer.toString('hex') };
};

export const aes256Decrypt = (encryptedText: string, key: string, initVec: string) => {
	const encryptedTextBuffer = Buffer.from(encryptedText, 'hex');
	const decipher = createDecipheriv(
		'aes-256-cbc',
		Buffer.from(key, 'hex'),
		Buffer.from(initVec, 'hex'),
	);
	const decrypted = decipher.update(encryptedTextBuffer);
	const decryptedBuffer = Buffer.concat([decrypted, decipher.final()]);
	return decryptedBuffer.toString();
};
