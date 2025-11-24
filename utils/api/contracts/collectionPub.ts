import type { AppRouter } from '@ts-rest/core';

import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

import { collectionPubQuerySchema } from 'server/collectionPub/schemas';

import {
	collectionPubSchema,
	createCollectionPubSchema,
	updateCollectionPubSchema,
} from '../schemas/collectionPub';
import { pubSchema } from '../schemas/pub';

extendZodWithOpenApi(z);

export const collectionPubRouter = {
	/**
	 * `GET /api/collectionPubs`
	 *
	 * Get the pubs associated with a collection
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-collectionPubs/get}
	 */
	get: {
		path: '/api/collectionPubs',
		method: 'GET',
		summary: 'Get the pubs associated with a collection',
		description: 'Get the pubs associated with a collection',
		query: collectionPubQuerySchema,
		responses: {
			200: z.array(pubSchema),
		},
	},
	/**
	 * `POST /api/collectionPubs`
	 *
	 * Add a pub to a collection
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-collectionPubs/post}
	 */
	create: {
		path: '/api/collectionPubs',
		method: 'POST',
		summary: 'Add a pub to a collection',
		description: 'Add a pub to a collection',
		body: createCollectionPubSchema,
		responses: {
			201: collectionPubSchema,
		},
	},
	/**
	 * `PUT /api/collectionPubs`
	 *
	 * Change the pubs that are associated with a collection
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-collectionPubs/put}
	 */
	update: {
		path: '/api/collectionPubs',
		method: 'PUT',
		summary: 'Update pubs for collection',
		description: 'Change the pubs that are associated with a collection',
		body: updateCollectionPubSchema.merge(
			z.object({
				communityId: z.string().uuid(),
			}),
		),
		responses: {
			200: updateCollectionPubSchema.omit({ id: true }),
		},
	},
	/**
	 * `DELETE /api/collectionPubs`
	 *
	 * Remove a pub from a collection
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-collectionPubs/delete}
	 */
	remove: {
		path: '/api/collectionPubs',
		method: 'DELETE',
		summary: 'Remove a pub from a collection',
		description: 'Remove a pub from a collection',
		body: z.object({
			id: z.string().uuid(),
			communityId: z.string().uuid(),
		}),
		responses: {
			200: z.string().uuid(),
		},
	},
} as const satisfies AppRouter;

type CollectionPubRouterType = typeof collectionPubRouter;

export interface CollectionPubRouter extends CollectionPubRouterType {}
