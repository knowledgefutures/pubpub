import type { AppRouter } from '@ts-rest/core';

import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const accountRouter = {
	/**
	 * `GET /api/account/deletionAudit`
	 *
	 * Get an audit of what will be affected by deleting the current user's account.
	 */
	deletionAudit: {
		method: 'GET',
		path: '/api/account/deletionAudit',
		summary: 'Get account deletion audit',
		description:
			'Returns counts of attributions, discussions, etc. that will be affected by deleting this account.',
		responses: {
			200: z.object({
				userId: z.string().uuid(),
				fullName: z.string(),
				email: z.string(),
				pubAttributionCount: z.number(),
				collectionAttributionCount: z.number(),
				commentCount: z.number(),
				soleAdminCommunities: z.array(
					z.object({ id: z.string().uuid(), title: z.string(), subdomain: z.string() }),
				),
			}),
			403: z.object({ message: z.string() }),
		},
	},
	/**
	 * `DELETE /api/account`
	 *
	 * Permanently delete the current user's account. Attributions are preserved
	 * with the user's name. Discussions/comments are anonymized.
	 */
	deleteAccount: {
		method: 'DELETE',
		path: '/api/account',
		summary: 'Delete account',
		description:
			'Permanently delete the current user account. Attributions are preserved with name. Discussions are anonymized.',
		body: z.object({
			password: z.string().describe('The SHA3 hash of the user password for confirmation'),
		}),
		responses: {
			200: z.object({ success: z.boolean() }),
			400: z.object({ message: z.string() }),
			403: z.object({ message: z.string() }),
		},
	},
	/**
	 * `POST /api/account/export`
	 *
	 * Start an export of the current user's account data. Returns either a
	 * cached URL or a worker task ID to poll.
	 */
	exportData: {
		method: 'POST',
		path: '/api/account/export',
		summary: 'Export account data',
		description:
			'Request a GDPR-compliant export of all account data as a downloadable .zip file containing JSON.',
		body: z.object({}),
		responses: {
			200: z.object({
				workerTaskId: z.string().uuid().optional(),
			}),
			403: z.object({ message: z.string() }),
			429: z.object({ message: z.string() }),
		},
	},
} as const satisfies AppRouter;

type AccountType = typeof accountRouter;

export interface AccountRouter extends AccountType {}
