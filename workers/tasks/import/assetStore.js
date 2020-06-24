import fs from 'fs';
import AWS from 'aws-sdk';

import { isProd } from 'utils/environment';
import { generateHash } from 'utils/hashes';

import { extensionFor } from './util';

AWS.config.setPromisesDependency(Promise);
const s3bucket = new AWS.S3({ params: { Bucket: 'assets.pubpub.org' } });

export const getUrlForAssetKey = (assetKey) => `https://assets.pubpub.org/${assetKey}`;

export const generateAssetKeyForFile = (filePath) => {
	const fileExtension = extensionFor(filePath);
	const folderName = isProd() ? generateHash(8) : '_testing';
	const randomness = Math.floor(Math.random() * 8);
	const now = new Date().getTime();
	return `${folderName}/${randomness}${now}.${fileExtension}`;
};

const blockForAssetFile = (assetKey) =>
	new Promise((resolve, reject) => {
		let attempts = 0;
		const checkForFile = () => {
			s3bucket
				.headObject({ Key: assetKey })
				.promise()
				.then(resolve)
				.catch(() => {
					if (attempts > 5) {
						return reject();
					}
					attempts += 1;
					return setTimeout(() => {
						checkForFile();
					}, 1000);
				});
		};
		checkForFile();
	});

export const downloadFileFromAssetStore = (assetKey, filePath) =>
	new Promise(async (resolve, reject) => {
		await blockForAssetFile(assetKey);
		const writeStream = fs.createWriteStream(filePath);
		s3bucket
			.getObject({ Key: assetKey })
			.createReadStream()
			.pipe(writeStream)
			.on('error', (error) => reject(error))
			.on('close', () => resolve(filePath));
	});

export const uploadFileToAssetStore = (filePath, givenAssetKey) => {
	const assetKey = givenAssetKey || generateAssetKeyForFile(filePath);
	const params = {
		Key: assetKey,
		Body: fs.createReadStream(filePath),
		ACL: 'public-read',
	};
	return new Promise((resolve, reject) => {
		s3bucket.upload(params, (err) => {
			if (err) {
				reject(err);
			}
			resolve(assetKey);
		});
	});
};
