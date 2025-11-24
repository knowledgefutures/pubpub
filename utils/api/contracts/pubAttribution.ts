import type { AppRouter } from '@ts-rest/core';

import type { Metadata } from '../utils/metadataType';

import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

import { createGetManyQueryOptions } from 'utils/query/createGetManyQuery';
import { createGetQueryOptions } from 'utils/query/createGetQuery';

import { updateAttributionSchema } from '../schemas/attribution';
import { pubSchema } from '../schemas/pub';
import {
	batchPubAttributionCreationSchema,
	pubAttributionCreationSchema,
	pubAttributionRemoveSchema,
	pubAttributionSchema,
	pubAttributionUpdateSchema,
} from '../schemas/pubAttribution';
import { userSchema } from '../schemas/user';

extendZodWithOpenApi(z);

// here to avoid circular imports, pubSchema also imports /schemas/pubAttribution
export const pubAttributionWithRelationsSchema = pubAttributionSchema.extend({
	pub: pubSchema.optional(),
	user: userSchema.optional(),
});

export const pubAttributionRouter = {
	/**
	 * `GET /api/pubAttributions/:id`
	 *
	 * Get a pub attribution
	 *
	 * @access You need to be an **admin** of this community in order to access this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-pubAttributions-id/get}
	 */
	get: {
		path: '/api/pubAttributions/:id',
		method: 'GET',
		summary: 'Get a pub attribution',
		description: 'Get a pub attribution',
		pathParams: z.object({ id: z.string().uuid() }),
		query: createGetQueryOptions(pubAttributionWithRelationsSchema, {
			include: { options: ['pub', 'user'], defaults: ['pub', 'user'] },
		}),
		responses: {
			200: pubAttributionWithRelationsSchema,
		},
		metadata: {
			loggedIn: 'admin',
		} satisfies Metadata,
	},
	/**
	 * `GET /api/pubAttributions`
	 *
	 * Get multiple pub attributions. You are limited to attributions in your community.
	 *
	 * @access You need to be an **admin** of this community in order to access this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-pubAttributions/get}
	 */
	getMany: {
		path: '/api/pubAttributions',
		method: 'GET',
		summary: 'Get multiple pub attributions',
		description:
			'Get multiple pub attributions. You are limited to attributions in your community.',
		query: createGetManyQueryOptions(pubAttributionWithRelationsSchema, {
			sort: {
				options: ['name', 'order', 'affiliation'],
			},
			include: { options: ['pub', 'user'], defaults: ['pub', 'user'] },
		}),
		responses: {
			200: z.array(pubAttributionWithRelationsSchema),
		},
		metadata: {
			loggedIn: 'admin',
		} satisfies Metadata,
	},
	/**
	 * `POST /api/pubAttributions/batch`
	 *
	 * Batch create pub attributions
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-pubAttributions-batch/post}
	 */
	batchCreate: {
		path: '/api/pubAttributions/batch',
		method: 'POST',
		summary: 'Batch create pub attributions',
		description: 'Batch create pub attributions',
		body: batchPubAttributionCreationSchema,
		responses: {
			201: z.array(pubAttributionSchema),
		},
	},
	/**
	 * `POST /api/pubAttributions`
	 *
	 * Add an attribution to a pub
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-pubAttributions/post}
	 */
	create: {
		path: '/api/pubAttributions',
		method: 'POST',
		summary: 'Create a pub attribution',
		description: 'Add an attribution to a pub',
		body: pubAttributionCreationSchema,
		responses: {
			201: pubAttributionSchema,
			500: z.string(),
		},
	},
	/**
	 * `PUT /api/pubAttributions`
	 *
	 * Update a pub attribution
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-pubAttributions/put}
	 */
	update: {
		path: '/api/pubAttributions',
		method: 'PUT',
		summary: 'Update a pub attribution',
		description: 'Update a pub attribution',
		body: pubAttributionUpdateSchema,
		responses: {
			200: updateAttributionSchema.partial().omit({ id: true }),
			500: z.string(),
		},
	},
	/**
	 * `DELETE /api/pubAttributions`
	 *
	 * Remove a pub attribution
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-pubAttributions/delete}
	 */
	remove: {
		path: '/api/pubAttributions',
		method: 'DELETE',
		summary: 'Remove a pub attribution',
		description: 'Remove a pub attribution',
		body: pubAttributionRemoveSchema,
		responses: {
			200: z.string().uuid().openapi({ description: 'The id of the deleted attribution' }),
			500: z.string(),
		},
	},
} as const satisfies AppRouter;

type PubAttributionRouterType = typeof pubAttributionRouter;

export interface PubAttributionRouter extends PubAttributionRouterType {}
