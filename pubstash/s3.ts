import { assetsClient } from 'server/utils/s3';
import { generateExportKey } from 'utils/export/keys';

/**
 * Upload a PDF buffer to S3 and return the public URL.
 */
export async function uploadPdfToS3(
	pdf: Buffer,
	opts: { communityId: string; pubId: string },
): Promise<string> {
	const key = generateExportKey(opts.communityId, opts.pubId, 'pdf');
	const { url } = await assetsClient.uploadFile(key, pdf);
	return url;
}
