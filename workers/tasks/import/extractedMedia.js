import fs from 'fs';
import path from 'path';

import { uploadFileToAssetStore } from './assetStore';
import { convertFileTypeIfNecessary } from './images';
import { getFullPathsInDir } from './util';

export const uploadExtractedMedia = async (tmpDirPath, mediaDirName = 'media') => {
	const mediaPath = path.join(tmpDirPath, mediaDirName);
	if (!fs.existsSync(mediaPath)) {
		return [];
	}
	return Promise.all(
		getFullPathsInDir(mediaPath).map(async (unconvertedFilePath) => {
			const filePath = await convertFileTypeIfNecessary(unconvertedFilePath);
			const assetKey = await uploadFileToAssetStore(filePath);
			return { assetKey: assetKey, clientPath: unconvertedFilePath };
		}),
	);
};
