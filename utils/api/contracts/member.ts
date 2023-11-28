import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';

import { memberPermissions } from 'types/member';
import { createGetQueryOptions } from 'utils/query/createGetQuery';
import { createGetManyQueryOptions } from 'utils/query/createGetManyQuery';
import {
	memberCreateSchema,
	memberRemoveSchema,
	memberSchema,
	memberUpdateSchema,
} from '../schemas/member';
import { collectionSchema } from '../schemas/collection';
import { communitySchema } from '../schemas/community';
import { pubSchema } from '../schemas/pub';
import { userSchema } from '../schemas/user';

extendZodWithOpenApi(z);

// here to avoid circular dependency between schema/member.ts and schema/pub.ts

export const memberWithRelationsSchema = memberSchema.extend({
	user: userSchema.optional(),
	community: communitySchema.optional(),
	pub: pubSchema.optional(),
	collection: collectionSchema.optional(),
});

const c = initContract();

export const memberContract = c.router({
	get: {
		path: '/api/members/:id',
		method: 'GET',
		summary: "Get a member by it's id",
		description: 'Get a member',
		pathParams: z.object({
			id: z.string().uuid(),
		}),
		query: createGetQueryOptions(memberWithRelationsSchema, {
			include: {
				options: ['user', 'community', 'pub', 'collection'],
				defaults: ['user'],
			},
		}),
		responses: {
			200: memberWithRelationsSchema,
		},
	},
	getMany: {
		path: '/api/members',
		method: 'GET',
		summary: 'Get all members from a community',
		description: 'Get many members',
		query: createGetManyQueryOptions(memberWithRelationsSchema, {
			include: {
				options: ['user', 'community', 'pub', 'collection'],
				defaults: ['user'],
			},
		}),
		responses: {
			200: z.array(memberWithRelationsSchema),
		},
	},
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
