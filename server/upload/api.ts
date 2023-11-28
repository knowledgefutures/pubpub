import type { AppRouteOptions } from '@ts-rest/express';

import { contract } from 'utils/api/contract';
import { generateHash } from 'utils/hashes';
import uuid from 'uuid';

import { createPubPubS3Client } from 'server/utils/s3';
import bb from 'busboy';
import mime from 'mime-types';
import { BadRequestError } from 'server/utils/errors';
import { mimeTypeSchema } from 'utils/api/schemas/upload';
import { ensureUserIsCommunityAdmin } from 'utils/ensureUserIsCommunityAdmin';

export const generateFileNameForUpload = (file: string) => {
	const folderName = generateHash(8);
	const extension = file !== undefined ? file.split('.').pop() : 'jpg';
	const random = Math.floor(Math.random() * 8);
	const now = new Date().getTime();
	return `${folderName}/${random}${now}.${extension}`;
};

/**
 * This is here because the default test enviroment does not have the AWS keys set.
 * Only runs if you are integration testing
 */
if (
	process.env.NODE_ENV === 'test' &&
	process.env.INTEGRATION_TESTING &&
	(!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)
) {
	// eslint-disable-next-line global-require, import/extensions
	require('../../config');
}

const s3Client = createPubPubS3Client({
	accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
	bucket: 'assets.pubpub.org',
	ACL: 'public-read',
});

const isDefaultMimeType = (mimeType: string | undefined): boolean =>
	mimeType === 'application/octet-stream' || !mimeType;

const defaultFilenames = ['blob', 'file'] as const;

const isDefaultFileName = (name: string | undefined): boolean =>
	defaultFilenames.some((defaultName) => name === defaultName) || !name;

const inferMimeTypeFromFileName = (filename: string | undefined): string => {
	if (!filename) {
		return 'application/octet-stream';
	}
	const inferredMime = mime.lookup(filename);
	return inferredMime || 'application/octet-stream';
};

const generateFileNameFromMimeType = (mimeType: string): string =>
	`${uuid()}.${mime.extension(mimeType)}`;

const validateMimeType = (mimeType: string): void => {
	try {
		mimeTypeSchema.parse(mimeType);
	} catch (err: any) {
		throw new Error(`Invalid mime type: ${mimeType}`);
	}
};

const validateFileNameAndMimeType = ({
	filename,
	mimeType,
}: {
	filename?: string;
	mimeType?: string;
}): { filename: string; mimeType: string } => {
	switch (true) {
		/**
		 * filename === undefined || 'blob' and mimetype === undefined || 'application/octect-stream'
		 * Exit, because we will not be able to properly set the mimetype or filename
		 * which makes donwloading the file from AWS weird
		 */
		case isDefaultMimeType(mimeType) && isDefaultFileName(filename): {
			throw new Error('No filename or mimetype provided');
		}
		/**
		 * no mimetype provided or it's `application/octet-stream`, infer from filename
		 */
		case isDefaultMimeType(mimeType) && !isDefaultFileName(filename): {
			mimeType = inferMimeTypeFromFileName(filename);
			break;
		}
		/**
		 * mimetype provided, no filename provided or filename = 'blob' || 'file', generate filename from mimetype
		 */
		case !isDefaultMimeType(mimeType) && isDefaultFileName(filename): {
			filename = generateFileNameFromMimeType(mimeType as string);
			break;
		}
		/**
		 * both mimetype and filename provided, do nothing
		 */
		default:
			break;
	}

	validateMimeType(mimeType as string);

	return { filename: filename as string, mimeType: mimeType as string };
};

export const uploadRouteImplementation: AppRouteOptions<typeof contract.upload> = {
	handler: async ({ req }) => {
		await ensureUserIsCommunityAdmin(req);

		const busboy = bb({ headers: req.headers });

		const result: Promise<{ url: string; key: string; size: number }> = new Promise(
			(resolve, reject) => {
				busboy.on('file', async (fieldname, file, { filename, mimeType }) => {
					try {
						const {
							filename: possiblyDerivedFilename,
							mimeType: possiblyDerivedMimeType,
						} = validateFileNameAndMimeType({
							filename,
							mimeType,
						});

						const key = generateFileNameForUpload(possiblyDerivedFilename);

						let size = 0;
						await s3Client.uploadFileSplit(key, file, {
							contentType: possiblyDerivedMimeType,
							progressCallback: (progress) => {
								// the pubpub fronted returns the size of the file
								// so we are mimicing that here
								size = progress.loaded ?? 0;
							},
						});

						resolve({ url: `https://assets.pubpub.org/${key}`, size, key });
					} catch (err: any) {
						reject(err);
					}
				});
			},
		);

		req.pipe(busboy);
		try {
			const bod = await result;

			return {
				status: 201,
				body: bod,
			};
		} catch (err: any) {
			throw new BadRequestError(err);
		}
	},
};
