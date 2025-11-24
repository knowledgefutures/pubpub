import type { Express, Request } from 'express';

import type * as types from 'types';

import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { initServer } from '@ts-rest/express';
import { z } from 'zod';

import { prepareResource, submitResource } from 'deposit/datacite/deposit';
import { transformPubToResource } from 'deposit/transform/pub';
import { assertValidResource } from 'deposit/validate';
import { generateDoi } from 'server/doi/queries';
import { ForbiddenError, NotFoundError } from 'server/utils/errors';
import { getPubDraftDoc } from 'server/utils/firebaseAdmin';
import { writeDocumentToPubDraft } from 'server/utils/firebaseTools';
import { getInitialData } from 'server/utils/initData';
import { contract } from 'utils/api/contract';
import { indexByProperty } from 'utils/arrays';
import { assert, expect } from 'utils/assert';
import { ensureUserIsCommunityAdmin } from 'utils/ensureUserIsCommunityAdmin';
import { isDuqDuq, isProd } from 'utils/environment';
import { createGetRequestIds } from 'utils/getRequestIds';
import { omitKeys } from 'utils/objects';
import { queryMany } from 'utils/query/queryMany';
import { queryOne } from 'utils/query/queryOne';

import { convertFiles, createUploadMiddleware, handleImport } from './import';
import { Pub } from './model';
import { canCreatePub, canDestroyPub, getUpdatablePubFields } from './permissions';
import { createPub, destroyPub, findPub, importToPub, updatePub } from './queries';
import { getPubsById, queryPubIds } from './queryMany';

extendZodWithOpenApi(z);

type ManyRequestParams = {
	query: Omit<types.PubsQuery, 'communityId'>;
	alreadyFetchedPubIds: string[];
	pubOptions: types.PubGetOptions;
};

const getManyQueryParams = <
	ReqB extends ManyRequestParams,
	A = any,
	B = any,
	C = any,
	D extends Record<string, any> = Record<string, any>,
	R extends Request<A, B, ReqB, C, D> = Request<A, B, ReqB, C, D>,
>(
	req: R,
): ManyRequestParams => {
	const { query, alreadyFetchedPubIds, pubOptions = {} } = req.body;
	const {
		collectionIds,
		excludeCollectionIds,
		excludePubIds,
		isReleased,
		limit = 50,
		offset = 0,
		ordering,
		scopedCollectionId,
		withinPubIds,
		term,
		submissionStatuses,
		relatedUserIds,
	} = query;
	return {
		pubOptions,
		alreadyFetchedPubIds,
		query: {
			collectionIds,
			excludeCollectionIds,
			excludePubIds,
			isReleased,
			limit,
			offset,
			ordering,
			scopedCollectionId,
			withinPubIds,
			term,
			submissionStatuses,
			relatedUserIds,
		},
	};
};
const getRequestIds = createGetRequestIds<{
	communityId?: string;
	collectionId?: string | null;
	pubId?: string;
	createPubToken?: string | null;
}>();

const s = initServer();

export const pubServer = s.router(contract.pub, {
	get: queryOne(Pub, { allowSlug: true }),
	getMany: queryMany(Pub),

	create: async ({ body, req }) => {
		const ids = getRequestIds(body, req.user);
		const { create, collectionIds } = await canCreatePub(ids);
		if (!create) {
			throw new ForbiddenError();
		}
		const createParams = omitKeys(body, ['communityId', 'collectionId', 'createPubToken']);
		const newPub = await createPub(
			{ communityId: ids.communityId, collectionIds, ...createParams },
			ids.userId,
		);
		const jsonedPub = newPub.toJSON();
		return {
			status: 201,
			body: jsonedPub,
		};
	},
	update: async ({ body, req }) => {
		const { userId, pubId } = getRequestIds(body, req.user);
		const updatableFields = await getUpdatablePubFields({
			userId,
			pubId,
		});
		if (!updatableFields) {
			throw new ForbiddenError();
		}

		const updateResult = await updatePub(req.body, updatableFields, userId);
		return {
			status: 200,
			body: updateResult,
		};
	},
	remove: async ({ body, req }) => {
		const { userId, pubId } = getRequestIds(body, req.user);
		const canDestroy = await canDestroyPub({ userId, pubId });
		if (!canDestroy) {
			throw new ForbiddenError();
		}

		await destroyPub(pubId, userId);
		return {
			status: 200,
			body: {},
		};
	},
	queryMany: async ({ req }) => {
		const initialData = await getInitialData(req, req.user);
		const { query: queryPartial, alreadyFetchedPubIds, pubOptions } = getManyQueryParams(req);
		const { limit } = queryPartial;
		const pubIds = await queryPubIds({
			...queryPartial,
			communityId: initialData.communityData.id,
		});
		const loadedAllPubs = limit && limit > pubIds.length;
		const idsToFetch = pubIds.filter((id) => !alreadyFetchedPubIds.includes(id));
		const pubs = await getPubsById(idsToFetch, pubOptions).sanitize(initialData);
		const pubsById = indexByProperty(pubs, 'id');
		return {
			status: 200,
			body: {
				pubIds: pubIds.filter((id) => !!pubsById[id] || alreadyFetchedPubIds.includes(id)),
				pubsById,
				loadedAllPubs,
			},
		};
	},
	doi: {
		deposit: async ({ params, req }) => {
			const { pubId } = params;
			const pubFields = await getUpdatablePubFields({ userId: req.user.id, pubId });
			try {
				assert(expect(pubFields).some((f) => f === 'doi'));
			} catch {
				throw new ForbiddenError();
			}
			const pub = expect(await findPub(pubId));
			const pubDoi =
				pub.doi ??
				(
					await generateDoi(
						{ communityId: pub.communityId, pubId, collectionId: undefined },
						'pub',
					)
				).pub;
			const jsonedPub = pub.toJSON();
			const resource = await transformPubToResource(jsonedPub, expect(jsonedPub.community));
			try {
				assertValidResource(resource);
			} catch (error) {
				return { status: 400, body: { error: (error as Error).message } };
			}
			try {
				const { resourceAst } = await submitResource(pub, resource, expect(pubDoi), {
					pubId,
				});
				return { status: 200, body: resourceAst };
			} catch (error) {
				return { status: 400, body: { error: (error as Error).message } };
			}
		},
		preview: async ({ req, params }) => {
			const { pubId } = params;
			const pubFields = await getUpdatablePubFields({ userId: req.user.id, pubId });
			try {
				assert(expect(pubFields).some((f) => f === 'doi'));
			} catch {
				throw new ForbiddenError();
			}
			const pub = expect(await findPub(pubId));

			const pubDoi =
				pub.doi ??
				(
					await generateDoi(
						{ communityId: pub.communityId, pubId, collectionId: undefined },
						'pub',
					)
				).pub;

			const jsonedPub = pub.toJSON();
			const resource = await transformPubToResource(jsonedPub, expect(jsonedPub.community));
			try {
				assertValidResource(resource);
			} catch (error) {
				return { status: 400, body: { error: (error as Error).message } };
			}
			try {
				const { resourceAst } = await prepareResource(pub, resource, expect(pubDoi));
				return { status: 200, body: resourceAst };
			} catch (error) {
				return { status: 400, body: { error: (error as Error).message } };
			}
		},
	},
	getResource: async ({ params }) => {
		const { pubId } = params;
		const pub = await findPub(pubId);
		if (!pub) {
			throw new NotFoundError();
		}
		const jsonedPub = pub.toJSON();
		const resource = await transformPubToResource(jsonedPub, expect(jsonedPub.community));
		return { status: 200, body: resource };
	},
	text: {
		get: async ({ params }) => {
			const doc = await getPubDraftDoc(params.pubId);

			return { status: 200, body: doc.doc };
		},
		update: async ({ req, params, body }) => {
			await ensureUserIsCommunityAdmin(req);

			await writeDocumentToPubDraft(params.pubId, body.doc, { method: body.method });

			const { doc } = await getPubDraftDoc(params.pubId);

			return { status: 200, body: { doc } };
		},
		importOld: async ({ req, body }) => {
			const community = await ensureUserIsCommunityAdmin(req);

			const { collectionId, ...createPubArgs } = body.pub ?? {};

			const baseUrl = `${req.protocol}://${req.get(
				isProd() || isDuqDuq() ? 'host' : 'localhost',
			)}`;

			const pub = await createPub({
				communityId: community.id,
				collectionIds: collectionId ? [collectionId] : undefined,
				...createPubArgs,
			});

			const task = await importToPub({
				pubId: pub.id,
				baseUrl,
				importBody: {
					sourceFiles: body.sourceFiles,
				},
			});

			return { status: 201, body: { doc: task.doc, pub: pub.toJSON() } };
		},
		import: {
			middleware: [
				async (req, res, next) => {
					return (await createUploadMiddleware())(req, res, next);
				},
			],
			handler: async ({ req, body, files }) => {
				const community = await ensureUserIsCommunityAdmin(req);

				const pubCreateParams = omitKeys(body, [
					'files',
					'overrides',
					'attributions',
					'overrideAll',
				]);

				return handleImport({
					// @ts-expect-error shh
					tmpDir: req.tmpDir,
					files: files as Express.Multer.File[],
					communityId: community.id,
					pubCreateParams,
					metadataOptions: {
						attributions: body.attributions,
						overrides: body.overrides,
					},
					userId: req.user.id,
				});
			},
		},
		importToPub: {
			middleware: [
				async (req, res, next) => {
					return (await createUploadMiddleware())(req, res, next);
				},
			],
			handler: async ({ req, body, files, params }) => {
				await ensureUserIsCommunityAdmin(req);

				return handleImport({
					// @ts-expect-error shh
					tmpDir: req.tmpDir,
					files: files as Express.Multer.File[],
					pubId: params.pubId,
					method: body.method,
					metadataOptions: {
						attributions: body.attributions,
						overrides: body.overrides,
					},
					userId: req.user.id,
				});
			},
		},
		convert: {
			middleware: [
				async (req, res, next) => {
					return (await createUploadMiddleware())(req, res, next);
				},
			],
			handler: async ({ req, files }) => {
				const result = await convertFiles({
					// @ts-expect-error shh
					tmpDir: req.tmpDir,
					files: files as Express.Multer.File[],
				});

				return {
					status: 200,
					body: result,
				};
			},
		},
	},
});
