import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { createGetQueryOptions } from 'utils/query/createGetQuery';
import { createGetManyQueryOptions } from 'utils/query/createGetManyQuery';
import {
	pageCreateSchema,
	pageRemoveSchema,
	pageSchema,
	pageUpdateSchema,
	pageWithRelationsSchema,
} from '../schemas/page';

extendZodWithOpenApi(z);

const c = initContract();

export const pageContract = c.router({
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
	},
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
	},
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
});
