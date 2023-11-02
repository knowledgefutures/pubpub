import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import {
	communityCreateSchema,
	communitySchema,
	communityUpdateSchema,
} from '../schemas/community';

extendZodWithOpenApi(z);

const c = initContract();

export const communityContract = c.router({
	/**
	 * Get a list of communities. Currently only returns the current community.
	 */
	getCommunities: {
		path: '/api/communities',
		method: 'GET',
		summary: 'Get the current community',
		description: 'Get a list of communities. Currently only returns the current community.',
		responses: {
			200: z.array(communitySchema),
		},
	},
	get: {
		path: '/api/communities/:id',
		method: 'GET',
		summary: "Get a community by it's id",
		description: 'Get a community',
		pathParams: z.object({
			id: z.string().uuid(),
		}),
		responses: {
			200: communitySchema,
		},
	},
	create: {
		path: '/api/communities',
		method: 'POST',
		summary: 'Create a community',
		description: 'Create a community',
		body: communityCreateSchema,
		responses: {
			201: z.string().url(),
		},
	},
	update: {
		path: '/api/communities',
		method: 'PUT',
		summary: 'Update a community',
		description: 'Update a community',
		body: communityUpdateSchema,
		responses: {
			200: communityUpdateSchema.partial(),
		},
	},
});
