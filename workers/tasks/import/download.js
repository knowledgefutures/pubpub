/* eslint-disable no-restricted-syntax */
import path from 'path';
import { ensureDir } from 'fs-extra';
import tmp from 'tmp-promise';

import { downloadFileFromAssetStore, uploadFileToAssetStore } from './assetStore';
import { convertFileTypeIfNecessary } from './images';

tmp.setGracefulCleanup();

export const downloadAndConvertFiles = async (sourceFiles, tmpDirectoryPath) => {
	return Promise.all(
		sourceFiles.map(async (sourceFile) => {
			const { assetKey, clientPath } = sourceFile;
			const tmpPath = path.join(tmpDirectoryPath, clientPath);
			await ensureDir(path.dirname(tmpPath));
			await downloadFileFromAssetStore(assetKey, tmpPath);
			const convertedTmpPath = await convertFileTypeIfNecessary(tmpPath);
			if (convertedTmpPath !== tmpPath) {
				const convertedKey = await uploadFileToAssetStore(convertedTmpPath);
				return { ...sourceFile, assetKey: convertedKey, tmpPath: convertedTmpPath };
			}
			return { ...sourceFile, tmpPath: tmpPath };
		}),
	);
};
