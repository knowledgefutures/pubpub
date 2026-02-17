import { initServer } from '@ts-rest/express';
import { Op } from 'sequelize';

import { setSubdomain } from 'server/dev/api';
import { WorkerTask } from 'server/models';
import { updateDiscussionCreationAccess } from 'server/publicPermissions/queries';
import { ForbiddenError, NotFoundError } from 'server/utils/errors';
import { addWorkerTask } from 'server/utils/workers';
import { getWorkerTask } from 'server/workerTask/queries';
import { contract } from 'utils/api/contract';
import { expect } from 'utils/assert';
import { communityUrl } from 'utils/canonicalUrls';
import {
	ensureUserIsCommunityAdmin,
	findCommunityByHostname,
} from 'utils/ensureUserIsCommunityAdmin';
import { isProd } from 'utils/environment';
import { createGetRequestIds } from 'utils/getRequestIds';

import { getPermissions } from './permissions';
import {
	CommunityURLAlreadyExistsError,
	createCommunity,
	getCommunity,
	updateCommunity,
} from './queries';

const getRequestIds = createGetRequestIds<{
	communityId?: string | null;
}>();

const s = initServer();

const MAX_DAILY_EXPORTS = 2;

export const communityServer = s.router(contract.community, {
	// @ts-expect-error
	archive: async ({ req }) => {
		const community = await ensureUserIsCommunityAdmin(req);

		const permissions = await getPermissions({
			userId: req.user?.id,
			communityId: community.id,
		});

		if (!permissions.archive) {
			throw new ForbiddenError();
		}

		const remainingExports = await WorkerTask.count({
			where: {
				type: 'archive',
				createdAt: {
					[Op.lt]: new Date(),
					[Op.gt]: new Date(new Date().getTime() - 1000 * 60 * 60 * 24),
				},
				input: {
					communityId: community.id,
				},
			},
		});

		if (!req.user?.dataValues.isSuperAdmin && remainingExports <= MAX_DAILY_EXPORTS) {
			throw new Error('You have reached the maximum number of daily exports.');
		}

		const key = `legacy-archive/${community.subdomain}/${Date.now()}/static`;

		// check if there's already one running
		const runningTask = await WorkerTask.findOne({
			where: {
				type: 'archive',
				input: { communityId: community.id },
				isProcessing: true,
			},
		});

		if (runningTask) {
			return {
				body: {
					url: `https://assets.pubpub.org/${key}`,
					workerTaskId: runningTask.id,
					message: 'Archive already in progress, please be patient.',
				},
				status: 200,
			};
		}

		const workerTask = await addWorkerTask({
			type: 'archive',
			input: { communityId: community.id, key },
		});

		if (req.body.dontWait) {
			return {
				body: { url: `https://assets.pubpub.org/${key}`, workerTaskId: workerTask.id },
				status: 200,
			};
		}

		let done = false;
		let workerTaskData: WorkerTask | null = null;

		while (!done) {
			// biome-ignore lint/performance/noAwaitInLoops: shhhhhh
			workerTaskData = await getWorkerTask({ workerTaskId: workerTask.id });
			if (workerTaskData?.isProcessing === false) {
				done = true;
			}
		}

		if (workerTaskData?.error) {
			throw new Error(workerTaskData.error);
		}

		return {
			body: { url: workerTaskData?.output!, workerTaskId: workerTask.id },
			status: 200,
		};
	},

	getCommunities: async ({ req }) => {
		const community = expect(await findCommunityByHostname(req.hostname));

		return {
			body: [community],
			status: 200,
		};
	},
	get: async ({ params }) => {
		const community = await getCommunity(params.id);

		if (!community) {
			throw new NotFoundError();
		}

		return {
			body: community,
			status: 200,
		};
	},
	create: async ({ req }) => {
		if (!req.user) {
			throw new ForbiddenError();
		}
		try {
			const newCommunity = await createCommunity(req.body, req.user);

			if (!isProd()) {
				await setSubdomain(newCommunity.subdomain);
				return {
					body: `http://localhost:9876`,
					status: 201,
				};
			}

			const baseUrl = communityUrl(newCommunity);

			return {
				body: baseUrl,
				status: 201,
			};
		} catch (e) {
			if (e instanceof CommunityURLAlreadyExistsError) {
				return {
					body: e.message,
					status: 409,
				};
			}
			console.error(e);

			throw new Error('Failed to create community');
		}
	},
	update: async ({ body, req }) => {
		const requestIds = getRequestIds(body, req.user);
		const permissions = await getPermissions(requestIds);
		if (!permissions.update) {
			throw new ForbiddenError();
		}
		const updatedValues = await updateCommunity(req.body, permissions.update, req.user.id);
		if (
			body.discussionCreationAccess !== undefined &&
			requestIds.communityId &&
			permissions.update
		) {
			await updateDiscussionCreationAccess({
				communityId: requestIds.communityId,
				discussionCreationAccess: body.discussionCreationAccess,
			});
		}
		return {
			body: updatedValues,
			status: 200,
		};
	},
});
