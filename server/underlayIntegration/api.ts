import { initServer } from '@ts-rest/express';

import { WorkerTask } from 'server/models';
import { ForbiddenError } from 'server/utils/errors';
import { addWorkerTask } from 'server/utils/workers';
import { contract } from 'utils/api/contract';
import { ensureUserIsCommunityAdmin } from 'utils/ensureUserIsCommunityAdmin';

import { getUnderlayIntegration, upsertUnderlayIntegration } from './queries';

const s = initServer();

export const underlayIntegrationServer = s.router(contract.underlayIntegration, {
	get: async ({ req }) => {
		const community = await ensureUserIsCommunityAdmin(req);
		const integration = await getUnderlayIntegration(community.id);
		return { status: 200, body: integration ?? null };
	},

	update: async ({ req, body }) => {
		const community = await ensureUserIsCommunityAdmin(req);
		const integration = await upsertUnderlayIntegration(community.id, body);
		return { status: 200, body: integration };
	},

	push: async ({ req }) => {
		const community = await ensureUserIsCommunityAdmin(req);

		const integration = await getUnderlayIntegration(community.id);
		if (!integration?.underlayOrg || !integration?.underlayCollection || !integration.hasApiKey) {
			throw new ForbiddenError(
				new Error('Underlay integration is not fully configured (org, collection, API key).'),
			);
		}

		// If a push is already running for this community, return it rather than double-enqueuing.
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

		return { status: 200, body: { workerTaskId: workerTask.id } };
	},
});
