/* eslint-disable no-await-in-loop */
import fs from 'fs';
import dateFormat from 'dateformat';
import { Storage, Bucket, File } from '@google-cloud/storage';

import { firebaseBackupsGcpBucket } from './constants';
import { getTmpFileForExtension } from './util';
import { BackupFile } from './types';

const getGoogleCloudServiceAccount = () => {
	const jsonString = Buffer.from(
		process.env.FIREBASE_SERVICE_ACCOUNT_BASE64!,
		'base64',
	).toString();
	return JSON.parse(jsonString);
};

const getFirebaseFilesFromGcp = async (
	bucket: Bucket,
	startDate: Date,
	maxLookbackDays = 1,
): Promise<{ data: File; rules: File }> => {
	const day = 1000 * 24 * 60 * 60;
	for (let lookbackDays = 0; lookbackDays < maxLookbackDays; lookbackDays++) {
		const date = new Date(startDate.getTime() - day * lookbackDays);
		const dateString = dateFormat(date, 'UTC:yyyy-mm-dd');
		const [files] = await bucket.getFiles({ prefix: dateString });
		const rules = files.find((file) => file.name.endsWith('rules.json.gz'));
		const data = files.find((file) => file.name.endsWith('data.json.gz'));
		if (rules && data) {
			return { rules, data };
		}
	}
	throw new Error(`Could not find Firebase data (maxLookbackDays=${maxLookbackDays})`);
};

const downloadGcpFile = async (file: File): Promise<BackupFile> => {
	const { path: localPath } = await getTmpFileForExtension('json.gz');
	const [metadata] = await file.getMetadata();
	const readStream = file.createReadStream();
	const writeStream = fs.createWriteStream(localPath);
	return new Promise((resolve, reject) => {
		readStream
			.on('end', () =>
				resolve({
					localPath,
					remotePath: file.name,
					size: parseInt(metadata.size, 10),
				}),
			)
			.on('error', reject);
		readStream.pipe(writeStream);
	});
};

export const getFirebaseBackupFiles = async (date: Date): Promise<BackupFile[]> => {
	const storage = new Storage({ credentials: getGoogleCloudServiceAccount() });
	const bucket = await storage.bucket(firebaseBackupsGcpBucket);
	const { rules, data } = await getFirebaseFilesFromGcp(bucket, date);
	return Promise.all([rules, data].map(downloadGcpFile));
};
