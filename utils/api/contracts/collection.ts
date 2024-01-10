import { type AppRouter } from '@ts-rest/core';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { createGetManyQueryOptions } from 'utils/query/createGetManyQuery';
import { createGetQueryOptions } from 'utils/query/createGetQuery';
import { resourceSchema } from '../schemas/resource';
import {
	collectionCreationSchema,
	collectionRemoveSchema,
	collectionSchema,
	collectionUpdateSchema,
	collectionWithRelationsSchema,
} from '../schemas/collection';
import { resourceASTSchema } from '../schemas/pub';

extendZodWithOpenApi(z);

export const collectionRouter = {
	/**
	 * `GET /api/collections/:slugOrId`
	 *
	 * Get a collection by it's id or slug
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-collections-slugOrId/get}
	 */
	get: {
		path: '/api/collections/:slugOrId',
		method: 'GET',
		summary: "Get a collection by it's id or slug",
		description: "Get a collection by it's id or slug",
		pathParams: z.object({
			slugOrId: z.string().openapi({
				description:
					'UUID input will be interpreted as an ID, otherwise it will be interpreted as a slug.',
			}),
		}),
		query: createGetQueryOptions(collectionWithRelationsSchema, {
			include: {
				options: ['community', 'page', 'attributions', 'collectionPubs', 'members'],
				defaults: ['attributions', 'collectionPubs'],
			},
		}),
		responses: {
			200: collectionWithRelationsSchema,
		},
	},
	/**
	 * `GET /api/collections`
	 *
	 * Get many collections
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-collections/get}
	 */
	getMany: {
		path: '/api/collections',
		method: 'GET',
		summary: 'Get many collections',
		description: 'Get many collections',
		query: createGetManyQueryOptions(collectionWithRelationsSchema, {
			omitFromFilter: { layout: true },
			sort: {
				options: ['title', 'kind', 'slug'],
			},
			include: {
				options: ['community', 'page', 'attributions', 'collectionPubs', 'members'],
				defaults: ['attributions', 'collectionPubs'],
			},
		}).optional(),
		responses: {
			200: z.array(collectionWithRelationsSchema),
		},
	},
	/**
	 * `POST /api/collections`
	 *
	 * Create a collection
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-collections/post}
	 */
	create: {
		path: '/api/collections',
		method: 'POST',
		summary: 'Create a collection',
		description: 'Create a collection',
		body: collectionCreationSchema,
		responses: {
			201: collectionSchema,
		},
	},
	/**
	 * `PUT /api/collections`
	 *
	 * Update a collection
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-collections/put}
	 */
	update: {
		path: '/api/collections',
		method: 'PUT',
		summary: 'Update a collection',
		description: 'Update a collection',
		body: collectionUpdateSchema,
		responses: {
			200: collectionCreationSchema.partial(),
		},
	},
	/**
	 * `DELETE /api/collections`
	 *
	 * Remove a collection
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-collections/delete}
	 */
	remove: {
		path: '/api/collections',
		method: 'DELETE',
		summary: 'Remove a collection',
		description: 'Remove a collection',
		body: collectionRemoveSchema,
		responses: {
			200: collectionSchema.shape.id,
		},
	},
	doi: {
		/**
		 * `POST /api/collections/:collectionId/doi`
		 *
		 * Deposit metadata to create a DOI
		 *
		 * @access You need to be **logged in** and have access to this resource.
		 *
		 * @routeDocumentation
		 * {@link https://pubpub.org/apiDocs#/paths/api-collections-collectionId-doi/post}
		 */
		deposit: {
			path: '/api/collections/:collectionId/doi',
			method: 'POST',
			summary: 'Create a DOI',
			description: 'Deposit metadata to create a DOI',
			pathParams: z.object({
				collectionId: z.string().uuid(),
			}),
			body: z.undefined(),
			responses: {
				200: resourceASTSchema,
				400: z.object({ error: z.string() }),
			},
		},
		/**
		 * `POST /api/collections/:collectionId/doi/preview`
		 *
		 * Preview a DOI deposit
		 *
		 * @access You need to be **logged in** and have access to this resource.
		 *
		 * @routeDocumentation
		 * {@link https://pubpub.org/apiDocs#/paths/api-collections-collectionId-doi-preview/post}
		 */
		preview: {
			path: '/api/collections/:collectionId/doi/preview',
			method: 'POST',
			summary: 'Preview a DOI deposit',
			description: 'Preview a DOI deposit',
			pathParams: z.object({
				collectionId: z.string().uuid(),
			}),
			body: z.undefined(),
			responses: {
				200: resourceASTSchema,
				400: z.object({ error: z.string() }),
			},
		},
	},
	/**
	 * `GET /api/collections/:collectionId/resource`
	 *
	 * Get collection as a resource
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-collections-collectionId-resource/get}
	 */
	getResource: {
		path: '/api/collections/:collectionId/resource',
		method: 'GET',
		summary: 'Get collection as a resource',
		description: 'Get collection as a resource',
		pathParams: z.object({
			collectionId: z.string().uuid(),
		}),
		responses: {
			200: resourceSchema,
		},
	},
} as const satisfies AppRouter;

type CollectionRouterType = typeof collectionRouter;

export interface CollectionRouter extends CollectionRouterType {}
