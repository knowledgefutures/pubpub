import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import {
	collectionAttributionCreationSchema,
	collectionAttributionRemoveSchema,
	collectionAttributionSchema,
	collectionAttributionUpdateSchema,
} from '../schemas/collectionAttribution';
import { updateAttributionSchema } from '../schemas/attribution';

extendZodWithOpenApi(z);

const c = initContract();

export const collectionAttributionContract = c.router(
	{
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
