import fs from 'fs';
import path from 'path';

import { uploadFileToS3 } from './s3';
import { convertFileTypeIfNecessary } from './images';

function getFullPathsInDir(dir) {
	let paths = [];
	fs.readdirSync(dir).forEach((file) => {
		const fullPath = path.join(dir, file);
		if (fs.lstatSync(fullPath).isDirectory()) {
			paths = paths.concat(getFullPathsInDir(fullPath));
		} else {
			paths.push(fullPath);
		}
	});
	return paths;
}

export const uploadExtractedMedia = async (tmpDirPath, mediaDirName = 'media') => {
	const mediaPath = path.join(tmpDirPath, mediaDirName);
	if (!fs.existsSync(mediaPath)) {
		return [];
	}
	return Promise.all(
		getFullPathsInDir(mediaPath).map(async (unconvertedFilePath) => {
			const filePath = await convertFileTypeIfNecessary(unconvertedFilePath);
			const url = await uploadFileToS3(filePath);
			return { url: url, localPath: unconvertedFilePath };
		}),
	);
};
