import fs from 'fs-extra';
import path from 'path';

export const createTarget = async (filePath) => {
	const stat = await fs.lstat(filePath);
	return {
		path: filePath,
		name: path.basename(filePath),
		isDirectory: stat.isDirectory,
	};
};
