import type { AppRouter } from '@ts-rest/core';

import { z } from 'zod';

import { uploadSchema } from '../schemas/upload';

export const uploadRouter = {
	/**
	 * `POST /api/upload`
	 *
	 * Upload a file to PubPub. For if you want to upload PDFs/images to use as formatted downloads
	 * or within a Pub.
	 *
	 * Abuse of this endpoint will result in a ban.
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-upload/post}
	 */
	file: {
		path: '/api/upload',
		method: 'POST',
		summary: 'Upload a file',
		description: `Upload a file to PubPub. For if you want to upload PDFs/images to use as formatted downloads or within a Pub.
		
		Abuse of this endpoint will result in a ban.`,
		body: uploadSchema,
		contentType: 'multipart/form-data',
		responses: {
			201: z.object({
				url: z.string().url(),
				size: z.number().int(),
				key: z.string(),
			}),
		},
		metadata: {
			loggedIn: 'admin',
		},
	},

	/**
	 * `GET /api/uploadPolicy`
	 *
	 * Get upload policy. Used for doing manual uploads.
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-uploadPolicy/get}
	 */
	policy: {
		path: '/api/uploadPolicy',
		method: 'GET',
		summary: 'Get upload policy',
		description: 'Get upload policy. Used for doing manual uploads.',
		query: z.object({
			contentType: z.string(),
			filename: z.string().optional(),
			key: z.string().optional(),
		}),
		responses: {
			200: z.object({
				acl: z.string(),
				awsAccessKeyId: z.string(),
				policy: z.string(),
				signature: z.string(),
				bucket: z.string(),
			}),
		},
	},
} as const satisfies AppRouter;

type UploadRouterType = typeof uploadRouter;
export interface UploadRouter extends UploadRouterType {}
