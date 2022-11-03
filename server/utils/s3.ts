import { Readable, Stream } from 'stream';
import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	PutObjectCommandInput,
	HeadObjectCommand,
	waitUntilObjectExists,
	HeadObjectCommandOutput,
} from '@aws-sdk/client-s3';

type UploadInput = PutObjectCommandInput['Body'];

type UploadResult = {
	url: string;
};

type PubPubS3ClientConfig = {
	accessKeyId: string;
	secretAccessKey: string;
	bucket: string;
	ACL?: string;
};

type PubPubS3Client = {
	uploadFile: (key: string, file: UploadInput, bufferStream?: boolean) => Promise<UploadResult>;
	downloadFile: (key: string) => Promise<Readable>;
	retrieveFileHead: (key: string) => Promise<null | HeadObjectCommandOutput>;
	checkIfFileExists: (key: string) => Promise<boolean>;
	waitForFileToExist: (key: string, maxWaitTimeSeconds?: number) => Promise<void>;
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
	): Promise<UploadResult> => {
		const body = buffer ? await bufferStream(file as Stream) : file;
		const putObjectCommand = new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			Body: body,
			ACL,
		});
		await s3Client.send(putObjectCommand);
		return { url: `https://${bucket}/${key}` };
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

	return {
		uploadFile,
		downloadFile,
		checkIfFileExists,
		waitForFileToExist,
		retrieveFileHead,
	};
};

export const assetsClient = createPubPubS3Client({
	accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
	bucket: 'assets.pubpub.org',
	ACL: 'public-read',
});
