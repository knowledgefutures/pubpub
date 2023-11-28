import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { createGetQueryOptions } from 'utils/query/createGetQuery';
import { createGetManyQueryOptions } from 'utils/query/createGetManyQuery';
import {
	batchCollectionAttributionCreationSchema,
	collectionAttributionCreationSchema,
	collectionAttributionRemoveSchema,
	collectionAttributionSchema,
	collectionAttributionUpdateSchema,
} from '../schemas/collectionAttribution';
import { updateAttributionSchema } from '../schemas/attribution';
import { collectionSchema } from '../schemas/collection';
import { userSchema } from '../schemas/user';

extendZodWithOpenApi(z);

const c = initContract();

export const collectionAttributionWithRelationsSchema = collectionAttributionSchema.extend({
	collection: collectionSchema.optional(),
	user: userSchema.optional(),
});

export const collectionAttributionContract = c.router(
	{
		get: {
			path: '/api/collectionAttributions/:id',
			method: 'GET',
			summary: 'Get a collection attribution',
			description: 'Get a collection attribution',
			pathParams: z.object({ id: z.string().uuid() }),
			query: createGetQueryOptions(collectionAttributionWithRelationsSchema, {
				include: { options: ['collection', 'user'], defaults: ['collection', 'user'] },
			}),
			responses: {
				200: collectionAttributionWithRelationsSchema,
			},
		},
		getMany: {
			path: '/api/collectionAttributions',
			method: 'GET',
			summary: 'Get multiple collection attributions',
			description:
				'Get multiple collection attributions. You are limited to attributions in your community.',
			query: createGetManyQueryOptions(collectionAttributionWithRelationsSchema, {
				sort: {
					options: ['name', 'order', 'affiliation'],
				},
				include: { options: ['collection', 'user'], defaults: ['collection', 'user'] },
			}),
			responses: {
				200: z.array(collectionAttributionWithRelationsSchema),
			},
		},
		batchCreate: {
			path: '/api/collectionAttributions/batch',
			method: 'POST',
			summary: 'Batch create collection attributions',
			description: 'Batch create collection attributions',
			body: batchCollectionAttributionCreationSchema,
			responses: {
				201: z.array(collectionAttributionSchema),
			},
		},
		create: {
			path: '/api/collectionAttributions',
			method: 'POST',
			summary: 'Create a collection attribution',
			description: 'Create a collection attribution',
			body: collectionAttributionCreationSchema,
			responses: {
				201: collectionAttributionSchema,
			},
		},
		update: {
			path: '/api/collectionAttributions',
			method: 'PUT',
			summary: 'Update a collection attribution',
			description: 'Update a collection attribution',
			body: collectionAttributionUpdateSchema,
			responses: {
				200: updateAttributionSchema.partial().omit({ id: true }),
			},
		},
		remove: {
			path: '/api/collectionAttributions',
			method: 'DELETE',
			summary: 'Remove a collection attribution',
			description: 'Remove a collection attribution',
			body: collectionAttributionRemoveSchema,
			responses: {
				200: z.string().openapi({ description: 'The id of the deleted attribution' }),
			},
		},
	},
	{
		strictStatusCodes: true,
	},
);
