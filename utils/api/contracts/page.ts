import type { AppRouter } from '@ts-rest/core';

import type { Metadata } from '../utils/metadataType';

import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

import { createGetManyQueryOptions } from 'utils/query/createGetManyQuery';
import { createGetQueryOptions } from 'utils/query/createGetQuery';

import {
	pageCreateSchema,
	pageRemoveSchema,
	pageSchema,
	pageUpdateSchema,
	pageWithRelationsSchema,
} from '../schemas/page';

extendZodWithOpenApi(z);

export const pageRouter = {
	/**
	 * `GET /api/pages/:slugOrId`
	 *
	 * Get a page by it's slug or id.
	 *
	 * @access You need to be an **admin** of this community in order to access this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-pages-slugOrId/get}
	 */
	get: {
		path: '/api/pages/:slugOrId',
		method: 'GET',
		summary: "Get a page by it's slug or id",
		description: "Get a page by it's slug or id.",
		pathParams: z.object({
			slugOrId: z.string().openapi({
				description:
					'UUID input will be interpreted as an ID, otherwise it will be interpreted as a slug.',
			}),
		}),
		query: createGetQueryOptions(pageWithRelationsSchema, {
			include: {
				options: ['community'],
				defaults: [],
			},
		}),
		responses: {
			200: pageSchema,
		},
		metadata: {
			loggedIn: 'admin',
		} satisfies Metadata,
	},
	/**
	 * `GET /api/pages`
	 *
	 * Get many pages
	 *
	 * @access You need to be an **admin** of this community in order to access this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-pages/get}
	 */
	getMany: {
		path: '/api/pages',
		method: 'GET',
		summary: 'Get many pages',
		description: 'Get many pages',
		query: createGetManyQueryOptions(pageWithRelationsSchema, {
			omitFromFilter: { layout: true },
			sort: {
				options: ['title', 'slug'],
			},
			include: {
				options: ['community'],
				defaults: [],
			},
		}),
		responses: {
			200: z.array(pageSchema),
		},
		metadata: {
			loggedIn: 'admin',
		} satisfies Metadata,
	},
	/**
	 * `POST /api/pages`
	 *
	 * Create a page
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-pages/post}
	 */
	create: {
		path: '/api/pages',
		method: 'POST',
		summary: 'Create a page',
		description: 'Create a page',
		body: pageCreateSchema,
		responses: {
			201: pageSchema,
		},
	},
	/**
	 * `PUT /api/pages`
	 *
	 * Update a page
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-pages/put}
	 */
	update: {
		path: '/api/pages',
		method: 'PUT',
		summary: 'Update a page',
		description: 'Update a page',
		body: pageUpdateSchema,
		responses: {
			201: pageUpdateSchema.omit({ pageId: true, communityId: true }).partial(),
		},
	},
	/**
	 * `DELETE /api/pages`
	 *
	 * Remove a page
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-pages/delete}
	 */
	remove: {
		path: '/api/pages',
		method: 'DELETE',
		summary: 'Remove a page',
		description: 'Remove a page',
		body: pageRemoveSchema,
		responses: {
			201: z.string().uuid().openapi({
				description: 'The ID of the removed page',
			}),
		},
	},
} as const satisfies AppRouter;

type PageRouterType = typeof pageRouter;

export interface PageRouter extends PageRouterType {}
