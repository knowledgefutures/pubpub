import fs from 'fs';
import { exec } from 'child_process';

import { BackupFile } from './types';
import { getTmpFileForExtension } from './util';
import { herokuApp } from './constants';

export const getDatabaseBackupFiles = async (): Promise<BackupFile[]> =>
	new Promise(async (resolve, reject) => {
		const { path: localPath } = await getTmpFileForExtension('dump.gz');
		const remotePath = `${new Date().toISOString()}-db-backup.dump.gz`;
		exec(`heroku pg:backups:download --output=${localPath} --app ${herokuApp}`, (error) => {
			if (error) {
				reject(new Error('Failed to download database'));
			} else {
				const { size } = fs.statSync(localPath);
				resolve([{ localPath, remotePath, size }]);
			}
		});
	});
