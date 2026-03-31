import crypto from 'node:crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

// ---------------------------------------------------------------------------
// S3 config – reuses the same bucket & credentials as the main PubPub app
// ---------------------------------------------------------------------------
const BUCKET = process.env.AWS_S3_BUCKET ?? 'assets.pubpub.org';
const REGION = process.env.AWS_S3_REGION ?? 'us-east-1';
const BASE_URL = process.env.AWS_S3_ASSET_PROXY ?? `https://${BUCKET}`;

const s3 = new S3Client({
	region: REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
	},
});

function generateKey(): string {
	return crypto.randomBytes(16).toString('hex');
}

/**
 * Upload a PDF buffer to S3 and return the public URL.
 */
export async function uploadPdfToS3(pdf: Buffer): Promise<string> {
	const key = `${generateKey()}.pdf`;

	await s3.send(
		new PutObjectCommand({
			Bucket: BUCKET,
			Key: key,
			Body: pdf,
			ContentType: 'application/pdf',
			ACL: 'public-read',
		}),
	);

	return `${BASE_URL}/${key}`;
}
