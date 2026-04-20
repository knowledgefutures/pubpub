import { initServer } from '@ts-rest/express';
import { Op } from 'sequelize';

import { setSubdomain } from 'server/dev/api';
import { WorkerTask } from 'server/models';
import { updateDiscussionCreationAccess } from 'server/publicPermissions/queries';
import { verifyCaptchaPayload } from 'server/utils/captcha';
import { BadRequestError, ForbiddenError, NotFoundError } from 'server/utils/errors';
import { handleHoneypotTriggered, isHoneypotFilled } from 'server/utils/honeypot';
import { addWorkerTask } from 'server/utils/workers';
import { contract } from 'utils/api/contract';
import { expect } from 'utils/assert';
import { communityUrl } from 'utils/canonicalUrls';
import {
	ensureUserIsCommunityAdmin,
	findCommunityByHostname,
} from 'utils/ensureUserIsCommunityAdmin';
import { isDevelopment, isDuqDuq, isProd } from 'utils/environment';
import { createGetRequestIds } from 'utils/getRequestIds';

import { destroyCommunity, getCommunityDeletionAudit } from './destroyCommunity';
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
	communityExport: async ({ req }) => {
		const community = await ensureUserIsCommunityAdmin(req);

		const permissions = await getPermissions({
			userId: req.user?.id,
			communityId: community.id,
		});

		if (!permissions.communityExport) {
			throw new ForbiddenError();
		}

		const recentExportCount = await WorkerTask.count({
			where: {
				type: 'communityExport',
				createdAt: {
					[Op.lt]: new Date(),
					[Op.gt]: new Date(new Date().getTime() - 1000 * 60 * 60 * 24),
				},
				input: {
					communityId: community.id,
				},
			},
		});

		if (!req.user?.dataValues.isSuperAdmin && recentExportCount >= MAX_DAILY_EXPORTS) {
			throw new Error('You have reached the maximum number of daily exports.');
		}

		const key = `exports/community/${community.id}/${Date.now()}`;

		// check if there's already one running
		const runningTask = await WorkerTask.findOne({
			where: {
				type: 'communityExport',
				input: { communityId: community.id },
				isProcessing: true,
			},
		});

		if (runningTask) {
			return {
				body: {
					workerTaskId: runningTask.id,
					message:
						'Export already in progress. You will receive an email when it is ready.',
				},
				status: 200,
			};
		}

		const workerTask = await addWorkerTask({
			type: 'communityExport',
			input: {
				communityId: community.id,
				key,
				requestedByEmail: req.user?.email,
			},
		});

		return {
			body: { workerTaskId: workerTask.id },
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
		if (isHoneypotFilled(req.body)) {
			await handleHoneypotTriggered(
				expect(req.user).id,
				'create-community',
				String(req.body._honeypot),
				{
					content: req.body.title
						? `title: ${req.body.title}, subdomain: ${req.body.subdomain}`
						: undefined,
				},
			);
			const subdomain = req.body.subdomain ?? 'community';
			return {
				body: `https://${subdomain}.pubpub.org`,
				status: 201,
			};
		}
		if (!(await verifyCaptchaPayload(req.body.altcha))) {
			throw new BadRequestError(new Error('Please complete the verification and try again.'));
		}
		const body = { ...req.body };
		delete body.altcha;
		delete body._honeypot;
		try {
			const newCommunity = await createCommunity(body, req.user);

			if (isDevelopment()) {
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

	deletionAudit: async ({ params, req }) => {
		const community = await ensureUserIsCommunityAdmin({ ...req, id: params.id });
		const audit = await getCommunityDeletionAudit(community.id);
		return { status: 200, body: audit };
	},

	remove: async ({ params, body, req }) => {
		const community = await ensureUserIsCommunityAdmin({ ...req, id: params.id });

		if (community.title !== body.confirmationTitle) {
			throw new BadRequestError(
				new Error(
					'Confirmation title does not match. Please type the exact community title to confirm deletion.',
				),
			);
		}

		await destroyCommunity(community.id, req.user!.id);
		return { status: 200, body: { success: true } };
	},
});
