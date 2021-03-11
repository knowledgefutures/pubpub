import fs from 'fs';
import AWS from 'aws-sdk';

import { backupsS3Bucket } from './constants';
import { BackupFile } from './types';

const getS3Instance = () => {
	const accessKeyId = process.env.AWS_BACKUP_ACCESS_KEY_ID;
	const secretAccessKey = process.env.AWS_BACKUP_SECRET_ACCESS_KEY;
	if (!accessKeyId || !secretAccessKey) {
		throw new Error('Missing AWS backup credentials in environment');
	}
	return new AWS.S3({ accessKeyId, secretAccessKey });
};

const s3 = getS3Instance();

export const uploadFileToS3 = (file: BackupFile, uploadId: string) => {
	const readableStream = fs.createReadStream(file.localPath);
	return s3
		.upload({
			Key: `${uploadId}/${file.remotePath}`,
			Bucket: backupsS3Bucket,
			Body: readableStream,
		})
		.promise();
};
