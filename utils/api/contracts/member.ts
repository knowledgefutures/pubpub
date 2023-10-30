import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { memberPermissions } from 'types/member';
import {
	memberCreateSchema,
	memberRemoveSchema,
	memberSchema,
	memberUpdateSchema,
} from '../schemas/member';

extendZodWithOpenApi(z);

const c = initContract();

export const memberContract = c.router({
	create: {
		path: '/api/members',
		method: 'POST',
		summary: 'Create a member',
		description: 'Create a member',
		body: memberCreateSchema,
		responses: {
			201: memberSchema,
		},
	},
	update: {
		path: '/api/members',
		method: 'PUT',
		summary: 'Update a member',
		description: 'Update a member',
		body: memberUpdateSchema,
		responses: {
			200: z.object({
				id: z.string().uuid(),
				permissions: z.enum(memberPermissions),
				isOwner: z.boolean().nullable(),
				subscribedToActivityDigest: z.boolean(),
			}),
		},
	},
	remove: {
		path: '/api/members',
		method: 'DELETE',
		summary: 'Remove a member',
		description: 'Remove a member',
		body: memberRemoveSchema,
		responses: {
			200: z.string({ description: 'The ID of the removed member' }).uuid(),
		},
	},
});
