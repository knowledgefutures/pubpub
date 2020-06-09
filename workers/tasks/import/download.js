/* eslint-disable no-restricted-syntax */
import path from 'path';
import { ensureDir } from 'fs-extra';
import tmp from 'tmp-promise';

import { downloadFileFromS3, uploadFileToS3 } from './s3';
import { convertFileTypeIfNecessary } from './images';

tmp.setGracefulCleanup();

export const downloadAndConvertFiles = async (sourceFiles, tmpDirectoryPath) => {
	return Promise.all(
		sourceFiles.map(async (sourceFile) => {
			const { url, localPath } = sourceFile;
			const tmpPath = path.join(tmpDirectoryPath, localPath);
			await ensureDir(path.dirname(tmpPath));
			await downloadFileFromS3(url, tmpPath);
			const convertedTmpPath = await convertFileTypeIfNecessary(tmpPath);
			if (convertedTmpPath !== tmpPath) {
				const convertedUrl = await uploadFileToS3(convertedTmpPath);
				return { ...sourceFile, url: convertedUrl, tmpPath: convertedTmpPath };
			}
			return { ...sourceFile, tmpPath: tmpPath };
		}),
	);
};
