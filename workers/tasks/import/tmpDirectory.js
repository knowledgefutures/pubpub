/* eslint-disable no-restricted-syntax */
import path from 'path';
import fs from 'fs';
import { ensureDir } from 'fs-extra';
import tmp from 'tmp-promise';

import { s3bucket } from './s3';

tmp.setGracefulCleanup();

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

const streamS3UrlToFile = (sourceUrl, filePath) =>
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

export const buildTmpDirectory = async (sourceFiles) => {
	const filesMap = new Map();
	const tmpDir = await tmp.dir();
	await Promise.all(
		sourceFiles.map(async (sourceFile) => {
			const { url, localPath } = sourceFile;
			const tmpPath = path.join(tmpDir.path, localPath);
			await ensureDir(path.dirname(tmpPath));
			const tmpFile = await streamS3UrlToFile(url, tmpPath);
			filesMap.set(localPath, tmpFile);
		}),
	);
	return {
		getTmpPathByLocalPath: (localPath) => filesMap.get(localPath),
		tmpDir: tmpDir,
	};
};
