import type { AppRouter } from '@ts-rest/core';
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
import { Metadata } from '../utils/metadataType';

extendZodWithOpenApi(z);

// here to avoid circular dependency between schema/member.ts and schema/pub.ts

export const memberWithRelationsSchema = memberSchema.extend({
	user: userSchema.optional(),
	community: communitySchema.optional(),
	pub: pubSchema.optional(),
	collection: collectionSchema.optional(),
});

export const memberRouter = {
	/**
	 * `GET /api/members/:id`
	 *
	 * Get a member
	 *
	 * @access You need to be an **admin** of this community in order to access this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-members-id/get}
	 */
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
		metadata: {
			loggedIn: 'admin',
		} satisfies Metadata,
	},
	/**
	 * `GET /api/members`
	 *
	 * Get many members
	 *
	 * @access You need to be an **admin** of this community in order to access this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-members/get}
	 */
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
		metadata: {
			loggedIn: 'admin',
		} satisfies Metadata,
	},
	/**
	 * `POST /api/members`
	 *
	 * Create a member
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-members/post}
	 */
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
	/**
	 * `PUT /api/members`
	 *
	 * Update a member
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-members/put}
	 */
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
	/**
	 * `DELETE /api/members`
	 *
	 * Remove a member
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-members/delete}
	 */
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
} as const satisfies AppRouter;

type MemberRouterType = typeof memberRouter;

export interface MemberRouter extends MemberRouterType {}
