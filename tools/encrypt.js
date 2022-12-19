/* eslint-disable global-require, no-console */
import { aes256Encrypt, aes256Decrypt } from '../utils/crypto';

// usage: npm run tools encrypt -- --text=text_to_encrypt
try {
	require('../config.js');
} catch {
	console.log('Using environment for AES_ENCRYPTION_KEY');
}

const { argv } = require('yargs');

const text = argv.text;
const decrypt = argv.decrypt ?? false;
const initVec = argv['init-vec'];
const key = argv.key?.toString() ?? process.env.AES_ENCRYPTION_KEY;

if (typeof decrypt !== 'boolean') {
	throw new Error('invalid --decrypt argument');
}

if (typeof key !== 'string') {
	throw new Error('invalid --key or env var AES_ENCRYPTION_KEY');
}

if (decrypt) {
	if (typeof initVec !== 'string') {
		throw new Error('invalid --init-vec argument');
	}
	process.stdout.write(aes256Decrypt(text, key, initVec));
} else {
	process.stdout.write(JSON.stringify(aes256Encrypt(text, key, initVec)));
}
