import path from 'path';
import fs from 'fs-extra';
import { spawn as spawnChildProcess } from 'child_process';

export const extensionFor = (filePath) => filePath.split('.').pop().toLowerCase();

export const spawn = (command, args): Promise<void> =>
	new Promise((resolve, reject) => {
		const ps = spawnChildProcess(command, args);
		ps.on('close', () => resolve());
		ps.stderr.on('data', (err) => reject(err.toString()));
	});

export const getFullPathsInDir = (dir) => {
	let paths: string[] = [];
	fs.readdirSync(dir).forEach((file) => {
		const fullPath = path.join(dir, file);
		if (fs.lstatSync(fullPath).isDirectory()) {
			paths = paths.concat(getFullPathsInDir(fullPath));
		} else {
			paths.push(fullPath);
		}
	});
	return paths;
};
