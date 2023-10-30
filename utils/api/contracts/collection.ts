import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { resourceSchema } from '../schemas/resource';
import {
	collectionCreationSchema,
	collectionRemoveSchema,
	collectionSchema,
	collectionUpdateSchema,
} from '../schemas/collection';
import { resourceASTSchema } from '../schemas/pub';

extendZodWithOpenApi(z);

const c = initContract();

export const collectionContract = c.router({
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
		deposit: {
			path: '/api/collection/:collectionId/doi',
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
		preview: {
			path: '/api/collection/:collectionId/doi/preview',
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
	getResource: {
		path: '/api/collection/:collectionId/resource',
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
});
