import { initServer } from '@ts-rest/express';
import { Op } from 'sequelize';

import { User, WorkerTask } from 'server/models';
import { authenticate } from 'server/utils/authenticate';
import { logout } from 'server/utils/logout';
import { addWorkerTask } from 'server/utils/workers';
import { contract } from 'utils/api/contract';

import { destroyUser, getUserDeletionAudit } from './destroyUser';

const s = initServer();

const ONE_DAY = 1000 * 60 * 60 * 24;
const MAX_DAILY_ACCOUNT_EXPORTS = 2;

export const accountServer = s.router(contract.account, {
	deletionAudit: async ({ req }) => {
		const userId = req.user?.id;

		if (!userId) {
			return {
				status: 403,
				body: { message: 'Must be logged in to view account deletion audit' },
			};
		}

		const audit = await getUserDeletionAudit(userId);
		return { status: 200, body: audit };
	},

	deleteAccount: async ({ req, res, body }) => {
		const userId = req.user?.id;

		if (!userId) {
			return {
				status: 403,
				body: { message: 'Must be logged in to delete account' },
			};
		}

		const userData = await User.findOne({ where: { id: userId } });

		if (!userData) {
			return {
				status: 403,
				body: { message: 'User not found' },
			};
		}

		// Require password confirmation
		try {
			await authenticate(userData, body.password);
		} catch (_error) {
			return { status: 403, body: { message: 'Password is incorrect' } };
		}

		// Block deletion if user is sole admin of any community
		const audit = await getUserDeletionAudit(userId);
		if (audit.soleAdminCommunities.length > 0) {
			return {
				status: 400,
				body: {
					message: `You are the only admin of ${audit.soleAdminCommunities.length} community/communities. Please add another admin or delete those communities first.`,
				},
			};
		}

		// Destroy the account first so logout only happens after successful deletion
		await destroyUser(userId);
		logout(req, res);

		return { status: 200, body: { success: true } };
	},

	exportData: async ({ req }) => {
		const userId = req.user?.id;

		if (!userId) {
			return {
				status: 403,
				body: { message: 'Must be logged in to export account data' },
			};
		}

		// Rate limit: max 2 exports per day
		const recentExportCount = await WorkerTask.count({
			where: {
				type: 'accountExport',
				createdAt: {
					[Op.lt]: new Date(),
					[Op.gt]: new Date(Date.now() - ONE_DAY),
				},
				input: { userId },
			},
		});

		if (recentExportCount >= MAX_DAILY_ACCOUNT_EXPORTS) {
			return {
				status: 429,
				body: { message: 'You have reached the maximum number of daily exports (2).' },
			};
		}

		// Check for an already-running export
		const runningTask = await WorkerTask.findOne({
			where: {
				type: 'accountExport',
				input: { userId },
				isProcessing: true,
			},
		});

		if (runningTask) {
			return {
				status: 200,
				body: {
					workerTaskId: runningTask.id,
				},
			};
		}

		const key = `exports/account/${userId}/${Date.now()}`;

		const workerTask = await addWorkerTask({
			type: 'accountExport',
			input: { userId, key },
		});

		return {
			status: 200,
			body: { workerTaskId: workerTask.id },
		};
	},
});

export const getAccountExports = async (userId: string) => {
	const exports = await WorkerTask.findAll({
		where: {
			type: 'accountExport',
			input: { userId },
		},
		attributes: ['id', 'createdAt', 'isProcessing', 'output', 'error'],
		order: [['createdAt', 'DESC']],
		limit: 20,
	});
	return exports;
};
