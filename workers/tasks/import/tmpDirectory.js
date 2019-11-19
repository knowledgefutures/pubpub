/* eslint-disable no-restricted-syntax */
import path from 'path';
import fs from 'fs';
import { ensureDir } from 'fs-extra';
import tmp from 'tmp-promise';

import { s3bucket } from './s3';

tmp.setGracefulCleanup();

const streamS3UrlToFile = (sourceUrl, filePath) =>
	new Promise(async (resolve, reject) => {
		const writeStream = fs.createWriteStream(filePath);
		s3bucket
			.getObject({ Key: sourceUrl.replace('https://assets.pubpub.org/', '') })
			.createReadStream()
			.on('end', () => resolve(filePath))
			.on('error', (error) => reject(error))
			.pipe(writeStream);
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
