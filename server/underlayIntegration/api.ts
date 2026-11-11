import { initServer } from '@ts-rest/express';

import { env } from 'server/env';
import { WorkerTask } from 'server/models';
import { probeUnderlay, UnderlayClient } from 'server/underlay/client';
import { ForbiddenError } from 'server/utils/errors';
import { addWorkerTask } from 'server/utils/workers';
import { contract } from 'utils/api/contract';
import { ensureUserIsCommunityAdmin } from 'utils/ensureUserIsCommunityAdmin';

import {
	beginPushLog,
	getPushHistory,
	getPushState,
	hasRunningPush,
} from '../underlayPushLog/queries';
import {
	getUnderlayIntegration,
	getUnderlayIntegrationWithKey,
	upsertUnderlayIntegration,
} from './queries';

/** Resolve an API key: use the one from the request body if provided, otherwise decrypt the saved one. */
const resolveApiKey = async (communityId: string, bodyApiKey?: string): Promise<string | null> => {
	if (bodyApiKey) {
		return bodyApiKey;
	}
	const withKey = await getUnderlayIntegrationWithKey(communityId);
	return withKey?.apiKey ?? null;
};

const s = initServer();

export const underlayIntegrationServer = s.router(contract.underlayIntegration, {
	get: async ({ req }) => {
		const community = await ensureUserIsCommunityAdmin(req);
		const integration = await getUnderlayIntegration(community.id);
		if (!integration) {
			return { status: 200, body: null };
		}
		// Attach current/last push state so a page reload can show an in-progress or just-finished push.
		const { currentPush, lastPush } = await getPushState(community.id);
		return { status: 200, body: { ...integration, currentPush, lastPush } };
	},

	history: async ({ req }) => {
		const community = await ensureUserIsCommunityAdmin(req);
		const history = await getPushHistory(community.id);
		return { status: 200, body: history };
	},

	update: async ({ req, body }) => {
		const community = await ensureUserIsCommunityAdmin(req);
		const integration = await upsertUnderlayIntegration(community.id, body);
		return { status: 200, body: integration };
	},

	probe: async ({ req, body }) => {
		const community = await ensureUserIsCommunityAdmin(req);
		const apiKey = await resolveApiKey(community.id, body.apiKey);
		if (!apiKey) {
			return {
				status: 200,
				body: { ok: false, error: 'No API key provided.', accounts: [], collections: [] },
			};
		}
		try {
			const result = await probeUnderlay(apiKey, {
				baseUrl: env.UNDERLAY_API_BASE_URL ?? undefined,
				owner: body.underlayOrg,
			});
			return {
				status: 200,
				body: { ok: true, ...result },
			};
		} catch (e) {
			return {
				status: 200,
				body: {
					ok: false,
					error: e instanceof Error ? e.message : String(e),
					accounts: [],
					collections: [],
				},
			};
		}
	},

	test: async ({ req, body }) => {
		const community = await ensureUserIsCommunityAdmin(req);

		const apiKey = await resolveApiKey(community.id, body.apiKey);
		if (!apiKey) {
			return {
				status: 200,
				body: { ok: false, message: 'No API key configured.' },
			};
		}

		const saved = await getUnderlayIntegration(community.id);
		const orgSlug = body.underlayOrg || saved?.underlayOrg;
		const colSlug = body.underlayCollection || saved?.underlayCollection;
		if (!orgSlug || !colSlug) {
			return {
				status: 200,
				body: { ok: false, message: 'Organization or collection is missing.' },
			};
		}

		const client = new UnderlayClient({
			apiKey,
			owner: orgSlug,
			slug: colSlug,
			baseUrl: env.UNDERLAY_API_BASE_URL ?? undefined,
		});

		try {
			// Read-only diagnostic: validates the base URL, API key, org access, and collection
			// existence WITHOUT creating anything (unlike ensureCollection).
			const check = await client.verifyConnection();
			return {
				status: 200,
				body: {
					ok: check.ok,
					message: check.message,
					details: check.steps.map((s) => `${s.ok ? '✓' : '✗'} ${s.message}`),
				},
			};
		} catch (e) {
			const detail = e instanceof Error ? e.message : String(e);
			return {
				status: 200,
				body: { ok: false, message: `Connection failed: ${detail}` },
			};
		}
	},

	push: async ({ req }) => {
		const community = await ensureUserIsCommunityAdmin(req);

		const integration = await getUnderlayIntegration(community.id);
		if (
			!integration?.underlayOrg ||
			!integration?.underlayCollection ||
			!integration.hasApiKey
		) {
			throw new ForbiddenError(
				new Error(
					'Underlay integration is not fully configured (org, collection, API key).',
				),
			);
		}

		// If a push is already running for this community, return it rather than double-enqueuing.
		// The push log is the source of truth (it's created synchronously below, before the worker
		// even starts), so a rapid double-click is caught even before the WorkerTask is picked up.
		const running = await hasRunningPush(community.id);
		if (running) {
			return {
				status: 200,
				body: {
					workerTaskId: running.workerTaskId ?? undefined,
					message: 'A push is already in progress.',
				},
			};
		}
		const runningTask = await WorkerTask.findOne({
			where: {
				type: 'pushToUnderlay',
				input: { communityId: community.id },
				isProcessing: true,
			},
		});
		if (runningTask) {
			return {
				status: 200,
				body: {
					workerTaskId: runningTask.id,
					message: 'A push is already in progress.',
				},
			};
		}

		const workerTask = await addWorkerTask({
			type: 'pushToUnderlay',
			input: { communityId: community.id },
		});
		// Create the `running` log now so a reload immediately reflects the in-progress push; the
		// worker adopts this same log when it starts (see beginPushLog).
		await beginPushLog(community.id, workerTask.id);

		return { status: 200, body: { workerTaskId: workerTask.id } };
	},
});
