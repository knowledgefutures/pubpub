import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { createGetQueryOptions } from 'utils/query/createGetQuery';
import { createGetManyQueryOptions } from 'utils/query/createGetManyQuery';
import {
	batchPubAttributionCreationSchema,
	pubAttributionCreationSchema,
	pubAttributionRemoveSchema,
	pubAttributionSchema,
	pubAttributionUpdateSchema,
} from '../schemas/pubAttribution';
import { updateAttributionSchema } from '../schemas/attribution';
import { pubSchema } from '../schemas/pub';
import { userSchema } from '../schemas/user';

extendZodWithOpenApi(z);

const c = initContract();

// here to avoid circular imports, pubSchema also imports /schemas/pubAttribution
export const pubAttributionWithRelationsSchema = pubAttributionSchema.extend({
	pub: pubSchema.optional(),
	user: userSchema.optional(),
});

export const pubAttributionContract = c.router({
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
	},
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
	},
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
});
