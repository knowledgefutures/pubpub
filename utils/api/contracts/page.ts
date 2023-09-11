import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { pageCreateSchema, pageRemoveSchema, pageSchema, pageUpdateSchema } from '../schemas/page';

extendZodWithOpenApi(z);

const c = initContract();

export const pageContract = c.router({
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
