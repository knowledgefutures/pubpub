import type { Readable, Stream } from 'stream';

import {
	CopyObjectCommand,
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	type HeadObjectCommandOutput,
	type ObjectCannedACL,
	PutObjectCommand,
	type PutObjectCommandInput,
	S3Client,
	waitUntilObjectExists,
} from '@aws-sdk/client-s3';
import { type Progress, Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { env } from 'server/env';

type UploadInput = PutObjectCommandInput['Body'];

type UploadResult = {
	url: string;
};

type PubPubS3ClientConfig = {
	accessKeyId: string;
	secretAccessKey: string;
	bucket: string;
	ACL?: ObjectCannedACL;
};

type PubPubS3Client = {
	uploadFile: (key: string, file: UploadInput, bufferStream?: boolean) => Promise<UploadResult>;
	uploadFileSplit: (
		key: string,
		file: UploadInput,
		options?: {
			contentType?: string;
			/**
			 * Max number of concurrent uploads
			 *
			 * @default 3
			 */
			partSize?: number;
			/**
			 * Size of each unit
			 *
			 * @default 5MB
			 */
			queueSize?: number;
			progressCallback?: (progress: Progress) => void | Promise<void>;
		},
	) => Promise<void>;
	downloadFile: (key: string) => Promise<Readable>;
	retrieveFileHead: (key: string) => Promise<null | HeadObjectCommandOutput>;
	checkIfFileExists: (key: string) => Promise<boolean>;
	waitForFileToExist: (key: string, maxWaitTimeSeconds?: number) => Promise<void>;
	getPresignedUrl: (key: string, expiresInSeconds?: number) => Promise<string>;
	deleteObject: (key: string) => Promise<void>;
	copyObjectTo: (key: string, destBucket: string) => Promise<void>;
	bucket: string;
};

const bufferStream = async (stream: Stream): Promise<Buffer> => {
	return new Promise<Buffer>((resolve, reject) => {
		const _buf: any[] = [];
		stream.on('data', (chunk) => _buf.push(chunk));
		stream.on('end', () => resolve(Buffer.concat(_buf)));
		stream.on('error', (err) => reject(err));
	});
};

export const createPubPubS3Client = (config: PubPubS3ClientConfig): PubPubS3Client => {
	const { accessKeyId, secretAccessKey, bucket, ACL } = config;

	const s3Client = new S3Client({
		region: 'us-east-1',
		credentials: {
			accessKeyId,
			secretAccessKey,
		},
	});

	const uploadFile = async (
		key: string,
		file: UploadInput,
		buffer?: boolean,
		contentLength?: number,
	): Promise<UploadResult> => {
		const body = buffer ? await bufferStream(file as Stream) : file;
		const putObjectCommand = new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			Body: body,
			ACL,
			...(!buffer && { ContentLength: contentLength }),
		});
		await s3Client.send(putObjectCommand);
		return { url: `https://${bucket}/${key}` };
	};

	const uploadFileSplit: PubPubS3Client['uploadFileSplit'] = async (
		key,
		file,
		{ contentType, queueSize, partSize, progressCallback } = {},
	) => {
		const parallelUploads3 = new Upload({
			client: s3Client,
			params: {
				Bucket: bucket,
				Key: key,
				Body: file,
				ACL,
				ContentType: contentType,
			},
			queueSize: queueSize ?? 3, // optional concurrency configuration
			partSize: partSize ?? 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
			leavePartsOnError: false, // optional manually handle dropped parts
		});

		if (progressCallback) {
			parallelUploads3.on('httpUploadProgress', progressCallback);
		}

		await parallelUploads3.done();
	};

	const downloadFile = async (key: string) => {
		const getObjectCommand = new GetObjectCommand({
			Bucket: bucket,
			Key: key,
		});
		const result = await s3Client.send(getObjectCommand);
		return result.Body as Readable;
	};

	const retrieveFileHead = async (key: string) => {
		const headObjectCommand = new HeadObjectCommand({
			Bucket: bucket,
			Key: key,
		});
		try {
			const headResult = await s3Client.send(headObjectCommand);
			return headResult;
		} catch (_) {
			return null;
		}
	};

	const checkIfFileExists = async (key: string) => {
		const maybeHead = await retrieveFileHead(key);
		return !!maybeHead;
	};

	const waitForFileToExist = async (key: string, maxWaitTimeSeconds = 10) => {
		await waitUntilObjectExists(
			{ client: s3Client, maxWaitTime: maxWaitTimeSeconds },
			{
				Bucket: bucket,
				Key: key,
			},
		);
	};

	const getPresignedUrl = async (key: string, expiresInSeconds = 7 * 24 * 60 * 60) => {
		const command = new GetObjectCommand({ Bucket: bucket, Key: key });
		// Type assertion needed due to @smithy/types version mismatch between
		// @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner
		const url = await getSignedUrl(s3Client as any, command as any, {
			expiresIn: expiresInSeconds,
		});
		// Rewrite S3 hostname to custom domain so download URLs are consistent.
		// Virtual-hosted: https://bucket.s3.region.amazonaws.com/key
		// Path-style:     https://s3.region.amazonaws.com/bucket/key
		const escapedBucket = bucket.replace(/\./g, '\\.');
		return url
			.replace(
				new RegExp(`https://${escapedBucket}\\.s3[^/]*\\.amazonaws\\.com`),
				`https://${bucket}`,
			)
			.replace(
				new RegExp(`https://s3[^/]*\\.amazonaws\\.com/${escapedBucket}`),
				`https://${bucket}`,
			);
	};

	const deleteObject = async (key: string) => {
		await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
	};

	const copyObjectTo = async (key: string, destBucket: string) => {
		const encodedKey = encodeURIComponent(key).replace(/%2F/g, '/');
		await s3Client.send(
			new CopyObjectCommand({
				Bucket: destBucket,
				Key: key,
				CopySource: `${bucket}/${encodedKey}`,
			}),
		);
	};

	return {
		uploadFile,
		uploadFileSplit,
		downloadFile,
		checkIfFileExists,
		waitForFileToExist,
		retrieveFileHead,
		getPresignedUrl,
		deleteObject,
		copyObjectTo,
		bucket,
	};
};

export const assetsClient = createPubPubS3Client({
	accessKeyId: env.AWS_ACCESS_KEY_ID,
	secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
	bucket: 'assets.pubpub.org',
	ACL: 'public-read',
});

/**
 * S3 client for private export files (account data, community archives).
 * Uploaded without public-read ACL; access is via presigned URLs (7-day expiry).
 * Presigned URLs are rewritten to use assets.pubpub.org as the hostname.
 */
export const exportsClient = createPubPubS3Client({
	accessKeyId: env.AWS_ACCESS_KEY_ID,
	secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
	bucket: 'assets.pubpub.org',
});

export const scamClient = createPubPubS3Client({
	accessKeyId: env.AWS_ACCESS_KEY_ID,
	secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
	bucket: 'reported-scams',
});
