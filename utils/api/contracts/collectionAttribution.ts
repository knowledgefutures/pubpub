import type { AppRouter } from '@ts-rest/core';

import type { Metadata } from '../utils/metadataType';

import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

import { createGetManyQueryOptions } from 'utils/query/createGetManyQuery';
import { createGetQueryOptions } from 'utils/query/createGetQuery';

import { updateAttributionSchema } from '../schemas/attribution';
import { collectionSchema } from '../schemas/collection';
import {
	batchCollectionAttributionCreationSchema,
	collectionAttributionCreationSchema,
	collectionAttributionRemoveSchema,
	collectionAttributionSchema,
	collectionAttributionUpdateSchema,
} from '../schemas/collectionAttribution';
import { userSchema } from '../schemas/user';

extendZodWithOpenApi(z);

export const collectionAttributionWithRelationsSchema = collectionAttributionSchema.extend({
	collection: collectionSchema.optional(),
	user: userSchema.optional(),
});

export const collectionAttributionRouter = {
	/**
	 * `GET /api/collectionAttributions/:id`
	 *
	 * Get a collection attribution
	 *
	 * @access You need to be an **admin** of this community in order to access this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-collectionAttributions-id/get}
	 */
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
		metadata: {
			loggedIn: 'admin',
		} satisfies Metadata,
	},
	/**
	 * `GET /api/collectionAttributions`
	 *
	 * Get multiple collection attributions. You are limited to attributions in your community.
	 *
	 * @access You need to be an **admin** of this community in order to access this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-collectionAttributions/get}
	 */
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
		metadata: {
			loggedIn: 'admin',
		} satisfies Metadata,
	},
	/**
	 * `POST /api/collectionAttributions/batch`
	 *
	 * Batch create collection attributions
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-collectionAttributions-batch/post}
	 */
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
	/**
	 * `POST /api/collectionAttributions`
	 *
	 * Create a collection attribution
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-collectionAttributions/post}
	 */
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
	/**
	 * `PUT /api/collectionAttributions`
	 *
	 * Update a collection attribution
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-collectionAttributions/put}
	 */
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
	/**
	 * `DELETE /api/collectionAttributions`
	 *
	 * Remove a collection attribution
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-collectionAttributions/delete}
	 */
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
} as const satisfies AppRouter;

type CollectionAttributionRouterType = typeof collectionAttributionRouter;

export interface CollectionAttributionRouter extends CollectionAttributionRouterType {}
