import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { communitySchema, communityUpdateSchema } from '../schemas/community';

extendZodWithOpenApi(z);

const c = initContract();

export const communityContract = c.router({
	update: {
		path: '/api/communities',
		method: 'PUT',
		summary: 'Update a community',
		description: 'Update a community',
		body: communityUpdateSchema,
		responses: {
			200: communitySchema,
		},
	},
});
