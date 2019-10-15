import fs from 'fs';
import path from 'path';

import { generateHash } from '../../../server/utils';
import { extensionFor } from './util';
import { s3bucket } from './s3';

const isPubPubProduction = !!process.env.PUBPUB_PRODUCTION;

const getKey = (folderName, fileExtension) =>
	`${folderName}/${Math.floor(Math.random() * 8)}${new Date().getTime()}.${fileExtension}`;

export const uploadExtractedMedia = async (tmpDir, mediaDirName = 'media') => {
	const mediaPath = path.join(tmpDir.path, mediaDirName);
	if (!fs.existsSync(mediaPath)) {
		return [];
	}
	return Promise.all(
		fs.readdirSync(mediaPath).map((fileName) => {
			const filePath = path.join(mediaPath, fileName);
			const folderName = isPubPubProduction ? generateHash(8) : '_testing';
			const key = getKey(folderName, extensionFor(filePath));
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
					resolve({ url: key, localPath: filePath });
				});
			});
		}),
	);
};
