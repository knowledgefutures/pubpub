import fs from 'fs';
import { exec } from 'child_process';

import { BackupFile } from './types';
import { getTmpFileForExtension } from './util';

export const getDatabaseBackupFiles = async (): Promise<BackupFile[]> =>
	new Promise(async (resolve, reject) => {
		const dbUrl = process.env.DATABASE_URL!;
		const { path: localPath } = await getTmpFileForExtension('dump.gz');
		const remotePath = `${new Date().toISOString()}-db-backup.dump.gz`;
		exec(`pg_dump -Fc ${dbUrl} > ${localPath}`, (error) => {
			if (error) {
				console.error(error);
				reject(new Error('Failed to download database'));
			} else {
				const { size } = fs.statSync(localPath);
				resolve([{ localPath, remotePath, size }]);
			}
		});
	});
