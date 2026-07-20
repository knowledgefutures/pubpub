import type { AppRouter } from '@ts-rest/core';

import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

/** Sanitized integration config returned to clients — never includes the API key itself. */
const underlayIntegrationSchema = z.object({
	id: z.string().uuid(),
	communityId: z.string().uuid().nullable(),
	underlayOrg: z.string().nullable(),
	underlayCollection: z.string().nullable(),
	includeReleaseHtml: z.boolean(),
	includeAssets: z.boolean(),
	includePdfs: z.boolean(),
	scheduleDays: z.number().int().nullable(),
	lastPushedAt: z.string().nullable(),
	lastPushSemver: z.string().nullable(),
	lastPushStatus: z.enum(['success', 'error', 'noop']).nullable(),
	lastPushError: z.string().nullable(),
	hasApiKey: z.boolean(),
});

const underlayIntegrationUpdateSchema = z.object({
	underlayOrg: z.string().nullable().optional(),
	underlayCollection: z.string().nullable().optional(),
	/** Plaintext key. Omit to leave unchanged; empty string clears it. */
	apiKey: z.string().nullable().optional(),
	includeReleaseHtml: z.boolean().optional(),
	includeAssets: z.boolean().optional(),
	includePdfs: z.boolean().optional(),
	scheduleDays: z.number().int().min(1).nullable().optional(),
});

export const underlayIntegrationRouter = {
	/**
	 * `GET /api/underlayIntegration`
	 *
	 * Get the current community's Underlay integration config (sanitized). Community admin only.
	 */
	get: {
		path: '/api/underlayIntegration',
		method: 'GET',
		summary: 'Get the Underlay integration config for the current community',
		description: 'Returns the sanitized integration config (no API key). Community admin only.',
		responses: {
			200: underlayIntegrationSchema.nullable(),
		},
	},
	/**
	 * `PUT /api/underlayIntegration`
	 *
	 * Create or update the current community's Underlay integration config. Community admin only.
	 */
	update: {
		path: '/api/underlayIntegration',
		method: 'PUT',
		summary: 'Update the Underlay integration config',
		description:
			'Create or update the integration config for the current community. Admin only.',
		body: underlayIntegrationUpdateSchema,
		responses: {
			200: underlayIntegrationSchema,
		},
	},
	/**
	 * `POST /api/underlayIntegration/push`
	 *
	 * Trigger a manual push to Underlay. Enqueues a worker task and returns its id for polling.
	 */
	push: {
		path: '/api/underlayIntegration/push',
		method: 'POST',
		summary: 'Push the community to Underlay now',
		description: 'Enqueues a push worker task. Community admin only.',
		body: z.object({}),
		responses: {
			200: z.object({
				workerTaskId: z.string().uuid(),
				message: z.string().optional(),
			}),
		},
	},
} as const satisfies AppRouter;

type UnderlayIntegrationRouterType = typeof underlayIntegrationRouter;

export interface UnderlayIntegrationRouter extends UnderlayIntegrationRouterType {}
