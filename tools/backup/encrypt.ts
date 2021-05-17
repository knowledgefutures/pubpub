import { exec } from 'child_process';

import { BackupFile } from './types';
import { getTmpFileForExtension } from './util';

export const encryptFile = async (file: BackupFile): Promise<BackupFile> => {
	const { path: encryptedFilePath } = await getTmpFileForExtension('gpg');
	return new Promise((resolve, reject) =>
		exec(
			`gpg --yes --batch --passphrase=${process.env.BACKUPS_SECRET} --output=${encryptedFilePath} --symmetric ${file.localPath}`,
			(error) => {
				if (error) {
					console.error(error);
					reject(new Error(`Failed to encrpyt ${file.localPath}`));
				} else {
					resolve({
						...file,
						localPath: encryptedFilePath,
						remotePath: `${file.remotePath}.gpg`,
					});
				}
			},
		),
	);
};
