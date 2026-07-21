import type { AppRouter } from '@ts-rest/core';

import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

const underlayPushWarningSchema = z.object({
	pubId: z.string().nullable().optional(),
	assetUrl: z.string().nullable().optional(),
	reason: z.string(),
});

/** A single push-history entry (also used for the in-progress and most-recent push on the config). */
const underlayPushLogSchema = z.object({
	id: z.string().uuid(),
	status: z.enum(['running', 'success', 'error', 'noop']),
	startedAt: z.string(),
	finishedAt: z.string().nullable(),
	semver: z.string().nullable(),
	recordCount: z.number().int().nullable(),
	fileCount: z.number().int().nullable(),
	message: z.string().nullable(),
	error: z.string().nullable(),
	warnings: z.array(underlayPushWarningSchema),
	workerTaskId: z.string().nullable(),
});

/** Sanitized integration config returned to clients — never includes the API key itself. */
const underlayIntegrationSchema = z.object({
	id: z.string().uuid(),
	communityId: z.string().uuid().nullable(),
	underlayOrg: z.string().nullable(),
	underlayCollection: z.string().nullable(),
	readme: z.string().nullable(),
	includeReleaseHtml: z.boolean(),
	includeAssets: z.boolean(),
	includePdfs: z.boolean(),
	scheduleDays: z.number().int().nullable(),
	lastPushedAt: z.string().nullable(),
	lastPushSemver: z.string().nullable(),
	lastPushStatus: z.enum(['success', 'error', 'noop']).nullable(),
	lastPushError: z.string().nullable(),
	hasApiKey: z.boolean(),
	/** In-progress push, if any — lets a page reload show that a push is running. Present on GET. */
	currentPush: underlayPushLogSchema.nullable().optional(),
	/** Most recent finished push. Present on GET. */
	lastPush: underlayPushLogSchema.nullable().optional(),
});

const underlayIntegrationUpdateSchema = z.object({
	underlayOrg: z.string().nullable().optional(),
	underlayCollection: z.string().nullable().optional(),
	readme: z.string().nullable().optional(),
	/** Plaintext key. Omit to leave unchanged; empty string clears it. */
	apiKey: z.string().nullable().optional(),
	includeReleaseHtml: z.boolean().optional(),
	includeAssets: z.boolean().optional(),
	includePdfs: z.boolean().optional(),
	scheduleDays: z.number().int().min(1).nullable().optional(),
});

const underlayAccountSchema = z.object({
	slug: z.string(),
	name: z.string(),
});

const underlayCollectionInfoSchema = z.object({
	slug: z.string(),
	name: z.string(),
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
	 * `POST /api/underlayIntegration/probe`
	 *
	 * Probe the Underlay API to discover available accounts and collections. Uses the provided
	 * API key if given, otherwise falls back to the saved key. Community admin only.
	 */
	probe: {
		path: '/api/underlayIntegration/probe',
		method: 'POST',
		summary: 'Discover Underlay accounts and collections',
		description:
			'Probe the Underlay API with a key to list available orgs and collections. Admin only.',
		body: z.object({
			apiKey: z.string().optional(),
			underlayOrg: z.string().optional(),
		}),
		responses: {
			200: z.object({
				ok: z.boolean(),
				error: z.string().optional(),
				accounts: z.array(underlayAccountSchema),
				collections: z.array(underlayCollectionInfoSchema),
			}),
		},
	},
	/**
	 * `POST /api/underlayIntegration/test`
	 *
	 * Test the connection to Underlay. Uses provided credentials if given, otherwise falls
	 * back to the saved config. Community admin only.
	 */
	test: {
		path: '/api/underlayIntegration/test',
		method: 'POST',
		summary: 'Test the Underlay connection',
		description:
			'Verify that the API key, org, and collection are valid. Accepts unsaved values. Admin only.',
		body: z.object({
			apiKey: z.string().optional(),
			underlayOrg: z.string().optional(),
			underlayCollection: z.string().optional(),
		}),
		responses: {
			200: z.object({
				ok: z.boolean(),
				message: z.string(),
				/** Step-by-step check results ("✓/✗ …") for display under the summary. */
				details: z.array(z.string()).optional(),
			}),
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
				workerTaskId: z.string().uuid().optional(),
				message: z.string().optional(),
			}),
		},
	},
	/**
	 * `GET /api/underlayIntegration/history`
	 *
	 * Recent push history for the current community (newest first, last ~90 days). Admin only.
	 */
	history: {
		path: '/api/underlayIntegration/history',
		method: 'GET',
		summary: 'Get recent Underlay push history',
		description: 'Returns recent push-log entries (newest first). Community admin only.',
		responses: {
			200: z.array(underlayPushLogSchema),
		},
	},
} as const satisfies AppRouter;

type UnderlayIntegrationRouterType = typeof underlayIntegrationRouter;

export interface UnderlayIntegrationRouter extends UnderlayIntegrationRouterType {}
