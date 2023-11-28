import { prepareResource, submitResource } from 'deposit/datacite/deposit';
import { generateDoi } from 'server/doi/queries';
import { ForbiddenError, NotFoundError } from 'server/utils/errors';
import { expect } from 'utils/assert';

import { z } from 'zod';
import { initServer } from '@ts-rest/express';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';

import { transformCollectionToResource } from 'deposit/transform/collection';
import { contract } from 'utils/api/contract';
import { createGetRequestIds } from 'utils/getRequestIds';
import { queryOne } from 'utils/query/queryOne';
import { queryMany } from 'utils/query/queryMany';

import { getPermissions } from './permissions';
import { createCollection, destroyCollection, findCollection, updateCollection } from './queries';
import { Collection } from './model';

extendZodWithOpenApi(z);

const getRequestIds = createGetRequestIds<{
	userId?: string;
	communityId?: string;
	id?: string;
}>();

const s = initServer();

export const collectionServer = s.router(contract.collection, {
	get: queryOne(Collection, { allowSlug: true }),
	getMany: queryMany(Collection),

	create: async ({ req, body }) => {
		const requestIds = getRequestIds(body, req.user);
		const permissions = await getPermissions({ ...requestIds });
		if (!permissions.create) {
			throw new ForbiddenError();
		}
		const newCollection = await createCollection(body, req.user.id);
		return { status: 201, body: newCollection };
	},

	update: async ({ req, body }) => {
		const requestIds = getRequestIds(body, req.user);
		const permissions = await getPermissions({ ...requestIds, collectionId: body.id });
		if (!permissions.update) {
			throw new ForbiddenError();
		}
		const updatedValues = await updateCollection(
			{
				...body,
				collectionId: body.id,
			},
			permissions.update,
			req.user.id,
		);
		return { status: 200, body: updatedValues };
	},

	remove: async ({ req, body }) => {
		const requestIds = getRequestIds(body, req.user);
		const permissions = await getPermissions({ ...requestIds, collectionId: body.id });
		if (!permissions.update) {
			throw new ForbiddenError();
		}
		await destroyCollection(
			{
				...body,
				collectionId: body.id,
			},
			req.user.id,
		);
		return { status: 200, body: body.id };
	},
	doi: {
		deposit: async ({ req, params }) => {
			const { collectionId } = params;
			const collection = await findCollection(collectionId);
			if (!collection) {
				throw new NotFoundError();
			}
			const permissions = await getPermissions({
				userId: req.user.id,
				collectionId,
				communityId: collection.communityId,
			});
			if (!permissions.update) {
				throw new ForbiddenError();
			}
			const collectionDoi =
				collection.doi ??
				(
					await generateDoi(
						{ communityId: collection.communityId, collectionId, pubId: undefined },
						'collection',
					)
				).collection;
			const resource = await transformCollectionToResource(
				collection.toJSON(),
				collection.community,
			);
			try {
				const { resourceAst } = await submitResource(
					collection,
					resource,
					expect(collectionDoi),
					{ collectionId },
				);
				return { status: 200, body: resourceAst };
			} catch (error) {
				return { status: 400, body: { error: (error as Error).message } };
			}
		},
		preview: async ({ req, params }) => {
			const { collectionId } = params;
			const collection = await findCollection(collectionId);
			const permissions = await getPermissions({
				userId: req.user.id,
				collectionId,
				communityId: collection.communityId,
			});
			if (!permissions.update) {
				throw new ForbiddenError();
			}
			const collectionDoi =
				collection.doi ??
				(
					await generateDoi(
						{ communityId: collection.communityId, collectionId, pubId: undefined },
						'collection',
					)
				).collection;
			const resource = await transformCollectionToResource(
				collection.toJSON(),
				collection.community,
			);
			try {
				const { resourceAst } = await prepareResource(
					collection,
					resource,
					expect(collectionDoi),
				);
				return { status: 200, body: resourceAst };
			} catch (error) {
				return { status: 400, body: { error: (error as Error).message } };
			}
		},
	},
	getResource: async ({ params }) => {
		const { collectionId } = params;
		const collection = await findCollection(collectionId);
		if (!collection) {
			throw new NotFoundError();
		}
		const resource = await transformCollectionToResource(
			collection.toJSON(),
			collection.community,
		);
		return { status: 200, body: resource };
	},
});
