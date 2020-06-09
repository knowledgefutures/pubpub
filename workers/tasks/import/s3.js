import fs from 'fs';
import AWS from 'aws-sdk';

import { isProd } from 'shared/utils/environment';
import { generateHash } from 'server/utils';

import { extensionFor } from './util';

AWS.config.setPromisesDependency(Promise);
const s3bucket = new AWS.S3({ params: { Bucket: 'assets.pubpub.org' } });

const getUrlKeyForFile = (folderName, fileExtension) =>
	`${folderName}/${Math.floor(Math.random() * 8)}${new Date().getTime()}.${fileExtension}`;

const blockForS3File = (key) =>
	new Promise((resolve, reject) => {
		let attempts = 0;
		const checkForFile = () => {
			s3bucket
				.headObject({ Key: key })
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

export const downloadFileFromS3 = (sourceUrl, filePath) =>
	new Promise(async (resolve, reject) => {
		const key = sourceUrl.replace('https://assets.pubpub.org/', '');
		await blockForS3File(key);
		const writeStream = fs.createWriteStream(filePath);
		s3bucket
			.getObject({ Key: key })
			.createReadStream()
			.pipe(writeStream)
			.on('error', (error) => reject(error))
			.on('close', () => resolve(filePath));
	});

export const uploadFileToS3 = (filePath) => {
	const folderName = isProd() ? generateHash(8) : '_testing';
	const key = getUrlKeyForFile(folderName, extensionFor(filePath));
	const params = {
		Key: key,
		Body: fs.createReadStream(filePath),
		ACL: 'public-read',
	};
	return new Promise((resolve, reject) => {
		s3bucket.upload(params, (err) => {
			if (err) {
				reject(err);
			}
			resolve(key);
		});
	});
};
