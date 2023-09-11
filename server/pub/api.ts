import { ForbiddenError, NotFoundError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { PubGetOptions, PubsQuery } from 'types';
import { indexByProperty } from 'utils/arrays';
import { transformPubToResource } from 'deposit/transform/pub';
import { generateDoi } from 'server/doi/queries';
import { assert, expect } from 'utils/assert';
import { prepareResource } from 'deposit/datacite/deposit';
import { assertValidResource } from 'deposit/validate';

import { z } from 'zod';
import { Request } from 'express';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { createGetRequestIds } from 'utils/getRequestIds';
import { contract } from 'utils/api/contract';
import { initServer } from '@ts-rest/express';
import { getPubsById, queryPubIds } from './queryMany';
import { createPub, destroyPub, findPub, updatePub } from './queries';
import { canCreatePub, canDestroyPub, getUpdatablePubFields } from './permissions';

extendZodWithOpenApi(z);

type ManyRequestParams = {
	query: Omit<PubsQuery, 'communityId'>;
	alreadyFetchedPubIds: string[];
	pubOptions: PubGetOptions;
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
	create: async ({ body, req }) => {
		const ids = getRequestIds(body, req.user);
		const { create, collectionIds } = await canCreatePub(ids);
		if (!create) {
			throw new ForbiddenError();
		}
		const newPub = await createPub({ communityId: ids.communityId, collectionIds }, ids.userId);
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
	getMany: async ({ req }) => {
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
				const { resourceAst } = await prepareResource(pub, resource, expect(pubDoi));
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
});
