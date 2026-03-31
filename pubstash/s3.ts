import crypto from 'node:crypto';

import { assetsClient } from 'server/utils/s3';

/**
 * Upload a PDF buffer to S3 and return the public URL.
 */
export async function uploadPdfToS3(pdf: Buffer): Promise<string> {
	const key = `${crypto.randomBytes(16).toString('hex')}.pdf`;
	const { url } = await assetsClient.uploadFile(key, pdf);
	return url;
}
