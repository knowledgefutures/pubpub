import crypto from 'crypto';

/**
 * Generate an S3 key for an exported document.
 *
 * Pattern: `c{communityId}/p{pubId}/exports/{random}.{extension}`
 *
 * This keeps exports grouped alongside a pub's other assets and makes it easy
 * to locate (or clean up) all exports for a given pub.
 */
export const generateExportKey = (communityId: string, pubId: string, extension: string) => {
	const random = crypto.randomBytes(8).toString('hex');
	return `c${communityId}/p${pubId}/exports/${random}.${extension}`;
};
