import { initServer } from '@ts-rest/express';
import { Op } from 'sequelize';
import { promisify } from 'util';

import { EmailChangeToken, User, WorkerTask } from 'server/models';
import { authenticate } from 'server/utils/authenticate';
import { sendEmailChangeEmail } from 'server/utils/email';
import { logout } from 'server/utils/logout';
import { addWorkerTask } from 'server/utils/workers';
import { contract } from 'utils/api/contract';
import { generateHash } from 'utils/hashes';

import { destroyUser, getUserDeletionAudit } from './destroyUser';

const s = initServer();

const ONE_DAY = 1000 * 60 * 60 * 24;
const MAX_DAILY_ACCOUNT_EXPORTS = 2;

export const accountServer = s.router(contract.account, {
	changePassword: async ({ req, res, body }) => {
		const userId = req.user?.id;

		if (!userId) {
			return {
				status: 403,
				body: { message: 'Must be logged in to change password' },
			};
		}

		const userData = await User.findOne({ where: { id: userId } });

		if (!userData) {
			return {
				status: 403,
				body: { message: 'User not found' },
			};
		}

		try {
			await authenticate(userData, body.currentPassword);
		} catch (_error) {
			return { status: 403, body: { message: 'Current password is incorrect' } };
		}

		try {
			const setPassword = promisify(userData.setPassword.bind(userData));
			const updatedUser = await setPassword(body.newPassword);

			await User.update(
				{
					hash: updatedUser?.dataValues.hash,
					salt: updatedUser?.dataValues.salt,
					passwordDigest: 'sha512',
				},
				{ where: { id: userId } },
			);

			// force logout after password change
			logout(req, res);

			return { status: 200, body: { success: true } };
		} catch (_error) {
			return { status: 403, body: { message: 'Failed to change password' } };
		}
	},

	initiateEmailChange: async ({ req, body }) => {
		const userId = req.user?.id;

		if (!userId) {
			return {
				status: 403,
				body: { message: 'Must be logged in to change email' },
			};
		}

		const newEmail = body.newEmail.toLowerCase().trim();

		const existingUser = await User.findOne({ where: { email: newEmail } });
		if (existingUser) {
			return {
				status: 400,
				body: { message: 'An account with this email already exists' },
			};
		}

		const userData = await User.findOne({ where: { id: userId } });

		if (!userData) {
			return {
				status: 403,
				body: { message: 'User not found' },
			};
		}

		try {
			await authenticate(userData, body.password);
		} catch (_error) {
			return { status: 403, body: { message: 'Password is incorrect' } };
		}

		try {
			const token = generateHash();
			const expiresAt = new Date(Date.now() + ONE_DAY);

			// invalidate any existing unused tokens for this user
			await EmailChangeToken.update(
				{ usedAt: new Date() },
				{
					where: {
						userId,
						usedAt: null,
					},
				},
			);

			// create new email change token
			await EmailChangeToken.create({
				userId,
				newEmail,
				token,
				expiresAt,
				usedAt: null,
			});

			await sendEmailChangeEmail({
				toEmail: newEmail,
				changeUrl: `https://${req.hostname}/email-change/${token}`,
			});

			return { status: 200, body: { success: true } };
		} catch (_error) {
			return { status: 400, body: { message: 'Failed to initiate email change' } };
		}
	},

	completeEmailChange: async ({ req, res, body }) => {
		const { token } = body;
		const currentTime = Date.now();

		const emailChangeToken = await EmailChangeToken.findOne({
			where: { token, usedAt: null },
		});

		if (!emailChangeToken) {
			return {
				status: 400,
				body: { message: 'Invalid or expired email change link' },
			};
		}

		if (Number(emailChangeToken.expiresAt) < currentTime) {
			return {
				status: 400,
				body: { message: 'Email change link has expired' },
			};
		}

		const newEmail = emailChangeToken.newEmail.toLowerCase().trim();
		const userId = emailChangeToken.userId;

		const existingUser = await User.findOne({ where: { email: newEmail } });
		if (existingUser && existingUser.id !== userId) {
			return {
				status: 400,
				body: { message: 'An account with this email already exists' },
			};
		}

		await EmailChangeToken.update(
			{ usedAt: new Date() },
			{ where: { id: emailChangeToken.id } },
		);

		await User.update({ email: newEmail }, { where: { id: userId } });

		// force logout after email change
		logout(req, res);

		return { status: 200, body: { success: true, newEmail } };
	},

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
