import fs from 'fs';

import { createPubPubS3Client } from 'server/utils/s3';

import { backupsS3Bucket } from './constants';
import { BackupFile } from './types';

const getS3Instance = () => {
	const accessKeyId = process.env.AWS_BACKUP_ACCESS_KEY_ID;
	const secretAccessKey = process.env.AWS_BACKUP_SECRET_ACCESS_KEY;
	if (!accessKeyId || !secretAccessKey) {
		throw new Error('Missing AWS backup credentials in environment');
	}
	return createPubPubS3Client({ accessKeyId, secretAccessKey, bucket: backupsS3Bucket });
};

const s3 = getS3Instance();

export const uploadFileToS3 = (file: BackupFile, uploadId: string) => {
	const readableStream = fs.createReadStream(file.localPath);
	return s3.uploadFile(`${uploadId}/${file.remotePath}`, readableStream);
};
