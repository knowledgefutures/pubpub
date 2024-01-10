import multer from 'multer';
import mime from 'mime-types';
import { Express } from 'express';

import * as types from 'types';

import { BadRequestError, NotFoundError } from 'server/utils/errors';

import { getTmpDirectoryPath } from 'workers/tasks/import/tmpDirectory';
import { importFiles } from 'workers/tasks/import/import';

import { BaseSourceFile } from 'utils/api/schemas/import';
import {
	ProposedMetadata,
	ImportCreatePubParams,
	MetadataOptions,
	ImportMethod,
} from 'utils/api/schemas/pub';
import { uploadAndConvertImages } from 'utils/import/uploadAndConvertImages';
import { omitKeys } from 'utils/objects';

import { labelFiles } from 'client/containers/Pub/PubDocument/PubFileImport/formats';

import { createPubAttribution } from 'server/pubAttribution/queries';
import { writeDocumentToPubDraft } from 'server/utils/firebaseTools';

import { managerUpdatableFields } from './permissions';
import { updatePub, createPub } from './queries';

import { Pub } from './model';

/**
 * We need to dynamically create the middleware in order to set a different temporary directory for
 * each request, otherwise there's a chance that two requests will try to write to the same file.
 */
export const createUploadMiddleware = async () => {
	const tmpDirPath = await getTmpDirectoryPath();

	const storage = multer.diskStorage({
		destination: (req, file, cb) => {
			// @ts-expect-error we are mutating baby
			req.tmpDir = tmpDirPath;
			cb(null, tmpDirPath);
		},
		filename: (req, file, cb) => {
			if (!file.originalname) {
				throw new BadRequestError(new Error('No filename provided.'));
			}

			if (file.mimetype === 'application/octet-stream') {
				const mimeType = mime.contentType(file.originalname);
				if (mimeType) {
					file.mimetype = mimeType;
				}
			}

			cb(null, file.originalname);
		},
	});

	const upload = multer({ storage }).array('files');
	return upload;
};

export const convertFiles = async ({ files, tmpDir }: ConvertInput) => {
	const sourceFilesFromNormalFiles = (files as Express.Multer.File[]).map(
		(file): BaseSourceFile & { tmpPath: string } => ({
			clientPath: file.filename ?? file.originalname,
			tmpPath: file.path,
			state: 'complete',
			loaded: file.size,
			total: file.size,
		}),
	);

	const uploadedAndConvertedFiles = await uploadAndConvertImages(
		sourceFilesFromNormalFiles,
		tmpDir,
	);
	const labeledFiles = labelFiles(uploadedAndConvertedFiles);

	return importFiles({
		sourceFiles: labeledFiles,
		importerFlags: {},
		tmpDirPath: tmpDir,
	});
};

async function addAttributionsToPub({
	pubId,
	attributions,
	existingAttributions = [],
	shouldMatchUsers = true,
}: {
	pubId: string;
	attributions: { name: string; mostLikelyUserId?: string }[];
	existingAttributions?: { userId?: string | null }[];
	shouldMatchUsers?: boolean;
}) {
	return Promise.all(
		attributions
			.filter((attr) => {
				const alreadyExists = !existingAttributions.some(
					(existingAttr) =>
						shouldMatchUsers && existingAttr.userId === attr.mostLikelyUserId,
				);

				return alreadyExists;
			})
			.map(async (attribution, idx) => {
				const { name, mostLikelyUserId } = attribution;
				const pubAttribution = await createPubAttribution({
					pubId,
					order: 1 / 2 ** idx,
					...(shouldMatchUsers && mostLikelyUserId
						? { userId: mostLikelyUserId }
						: {
								name,
						  }),
				});

				return pubAttribution as types.PubAttribution;
			}),
	);
}

const getDetectedParamsToUpdate = ({
	proposedMetadata,
	pubCreateParams,
	overrides,
	overrideAll,
}: {
	proposedMetadata: ProposedMetadata;
	pubCreateParams?: ImportCreatePubParams;
	overrides?: MetadataOptions['overrides'];
	overrideAll?: MetadataOptions['overrideAll'];
}) => {
	const detectedMetadata = omitKeys(proposedMetadata, ['attributions', 'metadata']);

	const fieldToOverrideWithDetected = Array.isArray(overrides) ? overrides : [overrides];

	const newParams = Object.entries(detectedMetadata).reduce((acc, [key, val]) => {
		// this value has been specified by the user, and we do want to override it with the detected value
		if (overrideAll || fieldToOverrideWithDetected?.some((field) => field === key)) {
			acc[key] = val;
		}

		return acc;
	}, pubCreateParams ?? {});

	return newParams;
};

const maybeAddAttributionsToPub = async ({
	pub,
	proposedAttributions,
	attributions,
}: {
	pub: Pub;
	proposedAttributions?: ProposedMetadata['attributions'];
	attributions?: boolean | 'match';
}) => {
	if (attributions === false || !proposedAttributions || proposedAttributions.length === 0) {
		return { ...pub.toJSON(), attributions: [] } as types.DefinitelyHas<
			types.Pub,
			'attributions'
		>;
	}

	const addedAttributions = await addAttributionsToPub({
		pubId: pub.id,
		attributions: proposedAttributions.map(({ name, users }) => ({
			name,
			mostLikelyUserId: users?.[0]?.id,
		})),
		shouldMatchUsers: attributions === 'match',
		existingAttributions: pub.attributions,
	});

	return Object.assign(pub.toJSON(), {
		attributions: addedAttributions ?? [],
	}) as types.DefinitelyHas<types.Pub, 'attributions'>;
};

type ConvertInput = {
	userId?: string;
	tmpDir: string;
	files: Express.Multer.File[];
};

type ToPubImportInput = ConvertInput & {
	pubId: string;
	metadataOptions?: MetadataOptions;
	method?: ImportMethod;
};
type CreatePubImportInput = ConvertInput & {
	tmpDir: string;
	files: Express.Multer.File[];
	communityId: string;
	pubCreateParams: ImportCreatePubParams;
	metadataOptions?: MetadataOptions;
};

export function handleImport(options: ToPubImportInput): Promise<{
	status: 200;
	body: {
		doc: types.DocJson;
		pub: types.DefinitelyHas<types.Pub, 'attributions'>;
	};
}>;
export function handleImport(options: CreatePubImportInput): Promise<{
	status: 201;
	body: {
		doc: types.DocJson;
		pub: types.DefinitelyHas<types.Pub, 'attributions'>;
	};
}>;
export async function handleImport(options: ToPubImportInput | CreatePubImportInput) {
	const { files, tmpDir, metadataOptions, userId } = options;

	if ('pubId' in options) {
		const { pubId, method } = options;

		const pub = await Pub.findOne({
			where: { id: pubId },
		});

		if (!pub) {
			throw new NotFoundError();
		}

		const { proposedMetadata, doc } = await convertFiles({ files, tmpDir });

		const newParams = getDetectedParamsToUpdate({
			proposedMetadata,
			overrides: metadataOptions?.overrides,
			overrideAll: metadataOptions?.overrideAll,
		});

		const modifiedText = await writeDocumentToPubDraft(pub.id, doc, { method });

		const updatedAttributes = Object.keys(newParams).length
			? await updatePub({ ...newParams, pubId }, managerUpdatableFields, userId)
			: {};

		const pubWithAttributionsAndUpdatedAttributes = Object.assign(
			await maybeAddAttributionsToPub({
				pub,
				proposedAttributions: proposedMetadata.attributions,
				attributions: metadataOptions?.attributions,
			}),
			updatedAttributes,
		);

		return {
			status: 200,
			body: { doc: modifiedText, pub: pubWithAttributionsAndUpdatedAttributes },
		};
	}

	const { communityId } = options;

	const { proposedMetadata, doc } = await convertFiles({ files, tmpDir });

	const newParams = getDetectedParamsToUpdate({
		proposedMetadata,
		pubCreateParams: options.pubCreateParams,
		overrides: metadataOptions?.overrides,
		overrideAll:
			Object.keys(options.pubCreateParams).length === 0 || metadataOptions?.overrideAll,
	});

	const pub = await createPub(
		{
			communityId,
			...newParams,
		},
		userId,
		['attributions'],
	);

	await writeDocumentToPubDraft(pub.id, doc);

	const pubWithAttributions = await maybeAddAttributionsToPub({
		pub,
		proposedAttributions: proposedMetadata.attributions,
		attributions: metadataOptions?.attributions || 'match',
	});

	return { status: 201, body: { doc, pub: pubWithAttributions } };
}
