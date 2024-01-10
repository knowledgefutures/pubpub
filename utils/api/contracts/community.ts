import type { AppRouter } from '@ts-rest/core';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import {
	communityCreateSchema,
	communitySchema,
	communityUpdateSchema,
} from '../schemas/community';

extendZodWithOpenApi(z);

export const communityRouter = {
	/**
	 * `GET /api/communities`
	 *
	 * Get a list of communities. Currently only returns the current community.
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-communities/get}
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
	/**
	 * `GET /api/communities/:id`
	 *
	 * Get a community
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-communities-id/get}
	 */
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
	/**
	 * `POST /api/communities`
	 *
	 * Create a community
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-communities/post}
	 */
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
	/**
	 * `PUT /api/communities`
	 *
	 * Update a community
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-communities/put}
	 */
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
} as const satisfies AppRouter;

type CommunityRouterType = typeof communityRouter;

export interface CommunityRouter extends CommunityRouterType {}
