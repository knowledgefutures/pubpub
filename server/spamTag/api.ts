import type { UserSpamTagFields } from 'types';

import { Router } from 'express';

import { ForbiddenError } from 'server/utils/errors';
import { wrap } from 'server/wrap';
import { expect } from 'utils/assert';

import { queryCommunitiesForSpamManagement } from './communityDashboard';
import { updateSpamTagForCommunity } from './communityQueries';
import { contextFromUser, notify } from './notifications';
import { canManipulateSpamTags } from './permissions';
import { getRecentDiscussionsForUser, queryUsersForSpamManagement } from './userDashboard';
import { getSpamTagForUser, removeSpamTagFromUser, upsertSpamTag } from './userQueries';

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
		const actorId = req.user?.id;
		const actorName = (req.user as any)?.fullName ?? 'Unknown';
		const fields =
			status === 'confirmed-spam' && actorId
				? {
						manuallyMarkedBy: [
							{ userId: actorId, userName: actorName, at: new Date().toISOString() },
						],
					}
				: undefined;

		const oldSpamTag = await getSpamTagForUser(userId);

		const { spamTag, user } = await upsertSpamTag({ userId, status, fields });
		const event = status === 'confirmed-spam' ? 'manual-ban' : 'spam-lifted';
		await notify(
			event,
			contextFromUser(user, {
				actorName,
				previousStatus: oldSpamTag?.status ?? null,
				spamFields: spamTag.fields as UserSpamTagFields,
			}),
		);
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
	const {
		offset,
		limit,
		searchTerm,
		status,
		ordering,
		spamTagPresence,
		communitySubdomain,
		createdAfter,
		createdBefore,
		activeAfter,
		activeBefore,
		minActivities,
		maxActivities,
	} = req.body;
	const canQuery = await canManipulateSpamTags({
		userId: expect(req.user).id,
	});
	if (!canQuery) {
		throw new ForbiddenError();
	}
	const queryResult = await queryUsersForSpamManagement({
		offset: offset && parseInt(offset, 10),
		limit: limit && parseInt(limit, 10),
		ordering,
		searchTerm,
		status: status ?? null,
		includeAffiliation: true,
		spamTagPresence,
		communitySubdomain,
		createdAfter,
		createdBefore,
		activeAfter,
		activeBefore,
		minActivities: minActivities != null ? Number(minActivities) : undefined,
		maxActivities: maxActivities != null ? Number(maxActivities) : undefined,
	});
	return res.status(200).send(queryResult);
});

router.post(
	'/api/spamTags/userRecentDiscussions',
	wrap(async (req, res) => {
		const canQuery = await canManipulateSpamTags({ userId: expect(req.user).id });
		if (!canQuery) {
			throw new ForbiddenError();
		}
		const { userId } = req.body;
		if (!userId || typeof userId !== 'string') {
			return res.status(400).send({ error: 'userId required' });
		}
		const discussions = await getRecentDiscussionsForUser(userId);
		return res.status(200).send(discussions);
	}),
);
