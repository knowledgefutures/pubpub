import fs from 'fs';

import { isProd } from 'utils/environment';
import { generateHash } from 'utils/hashes';
import { assetsClient } from 'server/utils/s3';

import { sleep } from 'utils/promises';
import { extensionFor } from './util';

export const getUrlForAssetKey = (assetKey) => `https://assets.pubpub.org/${assetKey}`;

export const generateAssetKeyForFile = (filePath) => {
	const fileExtension = extensionFor(filePath);
	const folderName = isProd() ? generateHash(8) : '_testing';
	const randomness = Math.floor(Math.random() * 8);
	const now = new Date().getTime();
	return `${folderName}/${randomness}${now}.${fileExtension}`;
};

const blockForAssetFile = (assetKey: string) =>
	new Promise<void>(async (resolve, reject) => {
		for (let i = 0; i < 5; i++) {
			// eslint-disable-next-line no-await-in-loop
			const exists = await assetsClient.checkIfFileExists(assetKey);
			if (exists) {
				return resolve();
			}
			// eslint-disable-next-line no-await-in-loop
			await sleep(1000);
		}
		return reject();
	});

export const downloadFileFromAssetStore = (assetKey: string, filePath: string) =>
	new Promise(async (resolve, reject) => {
		await blockForAssetFile(assetKey);
		const writeStream = fs.createWriteStream(filePath);
		const fileStream = await assetsClient.downloadFile(assetKey);
		fileStream
			.pipe(writeStream)
			.on('error', (error) => reject(error))
			.on('close', () => resolve(filePath));
	});

export const uploadFileToAssetStore = async (filePath: string, givenAssetKey?: string) => {
	const assetKey = givenAssetKey || generateAssetKeyForFile(filePath);
	const readStream = fs.createReadStream(filePath);
	await assetsClient.uploadFile(assetKey, readStream);
	return assetKey;
};
