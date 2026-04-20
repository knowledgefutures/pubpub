import type { AppRouter } from '@ts-rest/core';

import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

import {
	communityCreateSchema,
	communitySchema,
	communityUpdateSchema,
} from '../schemas/community';

extendZodWithOpenApi(z);

export const communityRouter = {
	communityExport: {
		path: '/api/communities/export',
		method: 'POST',
		summary: 'Export a community',
		description: 'Export a community as a zip archive. Community admin only.',
		body: z.object({}),
		responses: {
			200: z.object({
				workerTaskId: z.string().uuid(),
				message: z.string().optional(),
			}),
		},
	},
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
			409: z.string(),
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
	/**
	 * `GET /api/communities/:id/deletionAudit`
	 *
	 * Get an audit of what will be affected by deleting this community.
	 *
	 * @access Community admin or super admin.
	 */
	deletionAudit: {
		path: '/api/communities/:id/deletionAudit',
		method: 'GET',
		summary: 'Get community deletion audit',
		description:
			'Returns counts of pubs, DOI pubs, etc. that will be affected by deleting this community.',
		pathParams: z.object({
			id: z.string().uuid(),
		}),
		responses: {
			200: z.object({
				communityId: z.string().uuid(),
				communityTitle: z.string(),
				communitySubdomain: z.string(),
				totalPubs: z.number(),
				pubsWithDoi: z.number(),
				pubsWithReleases: z.number(),
				pubsWithoutDoi: z.number(),
			}),
		},
	},
	/**
	 * `DELETE /api/communities/:id`
	 *
	 * Permanently delete a community. Pubs with DOIs are moved to the
	 * archive community (archive.pubpub.org) to preserve the scholarly record.
	 *
	 * @access Community admin or super admin.
	 */
	remove: {
		path: '/api/communities/:id',
		method: 'DELETE',
		summary: 'Delete a community',
		description: 'Permanently delete a community. DOI pubs are moved to the archive community.',
		pathParams: z.object({
			id: z.string().uuid(),
		}),
		body: z.object({
			confirmationTitle: z
				.string()
				.describe('Must match the community title to confirm deletion'),
		}),
		responses: {
			200: z.object({ success: z.boolean() }),
		},
	},
} as const satisfies AppRouter;

type CommunityRouterType = typeof communityRouter;

export interface CommunityRouter extends CommunityRouterType {}
