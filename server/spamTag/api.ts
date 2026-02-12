import { Router } from 'express';

import { SpamTag, User } from 'server/models';
import { sendSpamBanEmail, sendSpamLiftedEmail } from 'server/utils/email';
import { ForbiddenError } from 'server/utils/errors';
import { deleteSessionsForUser } from 'server/utils/session';
import { wrap } from 'server/wrap';
import { expect } from 'utils/assert';

import { queryCommunitiesForSpamManagement } from './communities';
import { canManipulateSpamTags } from './permissions';
import { updateSpamTagForCommunity } from './queries';
import {
	addSpamTagToUser,
	getSpamTagForUser,
	removeSpamTagFromUser,
	updateSpamTagForUser,
} from './userQueries';
import { queryUsersForSpamManagement } from './users';

export const router = Router();

router.put(
	'/api/spamTags',
	wrap(async (req, res) => {
		const { communityId, status } = req.body;
		const canUpdate = await canManipulateSpamTags({ userId: req.user?.id });
		if (!canUpdate) {
			throw new ForbiddenError();
		}
		await updateSpamTagForCommunity({ communityId, status });
		return res.status(200).send({});
	}),
);

router.put(
	'/api/spamTags/user',
	wrap(async (req, res) => {
		const { userId, status } = req.body;
		const canUpdate = await canManipulateSpamTags({ userId: req.user?.id });
		if (!canUpdate) {
			throw new ForbiddenError();
		}
		const existingTag = await getSpamTagForUser(userId);
		if (!existingTag) {
			await addSpamTagToUser(userId);
		}
		await updateSpamTagForUser({ userId, status });
		const user = await User.findOne({
			where: { id: userId },
			attributes: ['email', 'fullName'],
		});

		if (user?.email) {
			try {
				if (status === 'confirmed-spam') {
					try {
						await deleteSessionsForUser(user?.email ?? '');
					} catch (err) {
						console.error('Failed to delete sessions for banned user', userId, err);
					}

					await sendSpamBanEmail({
						toEmail: user.email,
						userName: user.fullName ?? '',
					});
				} else if (status === 'confirmed-not-spam') {
					await sendSpamLiftedEmail({
						toEmail: user.email,
						userName: user.fullName ?? '',
					});
				}
			} catch (err) {
				console.error('Failed to send spam status email', err);
			}
		}
		return res.status(200).send({});
	}),
);

router.post('/api/spamTags/queryCommunitiesForSpam', async (req, res) => {
	const { offset, limit, searchTerm, status, ordering } = req.body;
	const canQuery = await canManipulateSpamTags({
		userId: expect(req.user).id,
	});
	if (!canQuery) {
		throw new ForbiddenError();
	}
	const queryResult = await queryCommunitiesForSpamManagement({
		offset: offset && parseInt(offset, 10),
		limit: limit && parseInt(limit, 10),
		ordering,
		searchTerm,
		status,
	});
	return res.status(200).send(queryResult);
});

router.delete(
	'/api/spamTags/user',
	wrap(async (req, res) => {
		const canUpdate = await canManipulateSpamTags({ userId: req.user?.id });
		if (!canUpdate) {
			throw new ForbiddenError();
		}
		const { userId } = req.body;
		if (!userId || typeof userId !== 'string') {
			return res.status(400).send({ error: 'userId required' });
		}
		await removeSpamTagFromUser(userId);
		return res.status(200).send({});
	}),
);

router.post('/api/spamTags/queryUsersForSpam', async (req, res) => {
	const { offset, limit, searchTerm, status, ordering } = req.body;
	const canQuery = await canManipulateSpamTags({
		userId: expect(req.user).id,
	});
	if (!canQuery) {
		throw new ForbiddenError();
	}
	const includeAll = !status || (Array.isArray(status) && status.length === 0);
	const queryResult = await queryUsersForSpamManagement({
		offset: offset && parseInt(offset, 10),
		limit: limit && parseInt(limit, 10),
		ordering,
		searchTerm,
		status: status ?? null,
		includeAffiliation: includeAll,
	});
	return res.status(200).send(queryResult);
});
