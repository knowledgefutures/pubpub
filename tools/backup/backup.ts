import prettyBytes from 'pretty-bytes';

import { postToSlack } from 'server/utils/slack';
import { generateHash } from 'utils/hashes';

import { getDatabaseBackupFiles } from './database';
import { getFirebaseBackupFiles } from './firebase';
import { uploadFileToS3 } from './s3';
import { BackupFile } from './types';
import { formatDate } from './util';

const postToSlackAboutSuccess = async (files: BackupFile[]) => {
	const fileLines = files.map((file) => {
		return `✅ \`${file.remotePath}\` _(${prettyBytes(file.size)})_`;
	});
	const text = `Backups completed:\n\n${fileLines.join('\n\n')}`;
	await postToSlack({ text, icon_emoji: ':floppy_disk:' });
};

const pickRandomErrorEmoji = () => {
	const errorEmojis = ['larry', 'this-is-fine', 'facepalm', 'scream2'];
	const index = Math.floor(Math.random() * errorEmojis.length);
	return `:${errorEmojis[index]}:`;
};

const postToSlackAboutError = async (error: Error) => {
	const text = '🚨 There was a problem creating backups:\n```\n' + error.stack! + '\n```';
	await postToSlack({ text, icon_emoji: pickRandomErrorEmoji() });
};

const main = async () => {
	try {
		const targetDate = new Date();
		const uploadId = `${formatDate(targetDate)}-${generateHash(8)}`;
		const backupFiles = await Promise.all([
			getFirebaseBackupFiles(targetDate),
			getDatabaseBackupFiles(),
		]).then((files) => files.reduce((acc, next) => [...acc, ...next], []));
		await Promise.all(backupFiles.map((file) => uploadFileToS3(file, uploadId)));
		await postToSlackAboutSuccess(backupFiles);
	} catch (err) {
		console.error(err);
		postToSlackAboutError(err);
	}
};

main();
