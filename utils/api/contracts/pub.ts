import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';

import { resourceSchema } from '../schemas/resource';
import {
	getManyQuerySchema,
	pubPostSchema,
	pubPutSchema,
	pubSchema,
	resourceASTSchema,
	sanitizedPubSchema,
} from '../schemas/pub';

extendZodWithOpenApi(z);

const c = initContract();

export const pubContract = c.router({
	create: {
		path: '/api/pubs',
		method: 'POST',
		summary: 'Create a Pub',
		description: 'Create a Pub',
		body: pubPostSchema,
		responses: {
			201: pubSchema,
		},
	},
	update: {
		path: '/api/pubs',
		method: 'PUT',
		summary: 'Update a Pub',
		description: 'Update a Pub',
		body: pubPutSchema,
		responses: {
			200: pubPutSchema.omit({
				pubId: true,
			}),
		},
	},
	remove: {
		path: '/api/pubs',
		method: 'DELETE',
		summary: 'Remove a Pub',
		description: 'Remove a Pub',
		body: z.object({
			pubId: z.string().uuid(),
		}),
		responses: {
			200: z.object({}),
		},
	},
	getMany: {
		path: '/api/pubs/many',
		method: 'POST',
		summary: 'Search for Pubs',
		description: 'Get many pubs',
		body: getManyQuerySchema,
		responses: {
			200: z.object({
				pubIds: z.array(z.string().uuid()),
				pubsById: z.record(sanitizedPubSchema),
				loadedAllPubs: z.boolean().or(z.number()).optional().nullable(),
			}),
		},
	},
	doi: {
		deposit: {
			path: '/api/pub/:pubId/doi',
			method: 'POST',
			summary: 'Create a DOI',
			description: 'Deposit metadata to create a DOI',
			pathParams: z.object({
				pubId: z.string().uuid(),
			}),
			body: z.null().or(z.object({})).optional(),
			responses: {
				200: resourceASTSchema,
				400: z.object({ error: z.string() }),
			},
		},
		preview: {
			path: '/api/pub/:pubId/doi/preview',
			method: 'POST',
			summary: 'Preview a DOI deposit',
			description: 'Preview a DOI deposit',
			pathParams: z.object({
				pubId: z.string().uuid(),
			}),
			body: z.null().or(z.object({})).optional(),
			responses: {
				200: resourceASTSchema,
				400: z.object({ error: z.string() }),
			},
		},
	},
	getResource: {
		path: '/api/pub/:pubId/resource',
		method: 'GET',
		summary: 'Get pub as a resource',
		description: 'Get pub as a resource',
		pathParams: z.object({
			pubId: z.string().uuid(),
		}),
		responses: {
			200: resourceSchema,
		},
	},
});
