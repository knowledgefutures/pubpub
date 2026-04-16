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
	archive: {
		path: '/api/communities/archive',
		method: 'POST',
		summary: 'Archive a community',
		description: 'Archive a community. Super admin only',
		body: z.object({
			dontWait: z.coerce
				.boolean()
				.default(false)
				.describe(
					"Don't wait for the archive to complete. If true, the archive will be queued and a URL will be returned and workertask will be returned.",
				),
		}),
		responses: {
			200: z.object({
				url: z.string(),
				workerTaskId: z.string().uuid(),
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
