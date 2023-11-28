import path from 'path';
import { ensureDir } from 'fs-extra';
import tmp from 'tmp-promise';
import mime from 'mime-types';

import { BaseSourceFile } from 'utils/api/schemas/import';

import { uploadFileToAssetStore } from 'workers/tasks/import/assetStore';
import { convertFileTypeIfNecessary } from 'workers/tasks/import/images';

tmp.setGracefulCleanup();

export const uploadAndConvertImages = async (
	sourceFiles: BaseSourceFile[],
	tmpDirectoryPath: string,
) => {
	return Promise.all(
		sourceFiles.map(async (sourceFile) => {
			const { clientPath } = sourceFile;
			const tmpPath = path.join(tmpDirectoryPath, clientPath);
			await ensureDir(path.dirname(tmpPath));
			const convertedTmpPath = await convertFileTypeIfNecessary(tmpPath);
			const mimeType = mime.contentType(path.extname(convertedTmpPath));
			if (mimeType && /image\/*/.test(mimeType)) {
				const convertedKey = await uploadFileToAssetStore(convertedTmpPath);
				return { ...sourceFile, assetKey: convertedKey, tmpPath: convertedTmpPath };
			}
			return { ...sourceFile, tmpPath: convertedTmpPath };
		}),
	);
};
