import type { SpamFieldsFilter, SpamFieldsFilterKey, UserSpamTagFields } from 'types';

import { Router } from 'express';

import { notifyBannersOfCommunityBanResolution } from 'server/communityBan/queries';
import { Community, Member, SpamTag, User } from 'server/models';
import { isUserSuperAdmin } from 'server/user/queries';
import { sendEmail } from 'server/utils/email/transport';
import { ForbiddenError } from 'server/utils/errors';
import { postToSlack } from 'server/utils/slack';
import { wrap } from 'server/wrap';
import { expect } from 'utils/assert';
import { schedulePurge } from 'utils/caching/schedulePurgeWithSentry';
import { getSuperAdminTabUrl } from 'utils/superAdmin';

import { queryCommunitiesForSpamManagement } from './communityDashboard';
import { updateSpamTagForCommunity } from './communityQueries';
import { contextFromUser, notify } from './notifications';
import { canManipulateSpamTags } from './permissions';
import {
	getAffiliationForUserIds,
	getRecentDiscussionsForUser,
	queryUsersForSpamManagement,
} from './userDashboard';
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

router.post(
	'/api/spamTags/requestCommunityReview',
	wrap(async (req, res) => {
		const userId = req.user?.id;
		if (!userId) {
			throw new ForbiddenError();
		}
		const { communityId, message } = req.body;
		if (!communityId || typeof communityId !== 'string') {
			return res.status(400).send({ error: 'communityId required' });
		}

		// Verify user is an admin of this community
		const membership = await Member.findOne({
			where: { communityId, userId, permissions: 'admin' },
		});
		if (!membership) {
			throw new ForbiddenError();
		}

		const community = await Community.findByPk(communityId, {
			include: [{ model: SpamTag, as: 'spamTag' }],
		});
		if (!community?.spamTag) {
			return res.status(404).send({ error: 'Community or spam tag not found' });
		}

		if (community.spamTag.status !== 'unreviewed') {
			return res.status(400).send({ error: 'Community has already been reviewed' });
		}
		if (community.spamTag.approvalRequestedAt) {
			return res.status(400).send({ error: 'Approval has already been requested' });
		}

		const trimmedMessage = typeof message === 'string' ? message.trim().slice(0, 2000) : null;

		await community.spamTag.update({
			approvalRequestedAt: new Date(),
			approvalRequestMessage: trimmedMessage || null,
			approvalRequestedByUserId: userId,
		});

		const user = await User.findByPk(userId, {
			attributes: ['fullName', 'email', 'slug'],
		});

		const communityUrl = `https://${community.subdomain}.pubpub.org`;
		const reviewUrl = `https://pubpub.org${getSuperAdminTabUrl('spam')}?q=${encodeURIComponent(community.subdomain)}`;
		const requesterName = user?.fullName ?? 'Unknown';
		const requesterEmail = user?.email ?? 'unknown';

		// Notify team (fire-and-forget — don't block the user response)
		const messageBlock = trimmedMessage ? `\nMessage from requester:\n${trimmedMessage}\n` : '';
		sendEmail({
			to: ['help@pubpub.org'],
			subject: `Approval requested: ${community.title}`,
			text: [
				`A community admin has requested approval for "${community.title}" to be made publicly visible.`,
				'',
				`Community: ${communityUrl}`,
				`Requested by: ${requesterName} (${requesterEmail})`,
				`Spam score: ${community.spamTag.spamScore}`,
				messageBlock,
				`Review in dashboard: ${reviewUrl}`,
				'',
				'-- PubPub Spam System',
			].join('\n'),
		}).catch((err) => console.error('Failed to send approval request email', err));

		postToSlack({
			icon_emoji: ':clipboard:',
			text: `Approval requested for ${community.title}`,
			attachments: [
				{
					fallback: `Approval requested: ${community.title} by ${requesterName}`,
					color: '#2196f3',
					blocks: [
						{
							type: 'section',
							text: {
								type: 'mrkdwn',
								text: `*<${communityUrl}|${community.title}>* — approval requested by ${requesterName}${trimmedMessage ? `\n> ${trimmedMessage.slice(0, 300)}` : ''}`,
							},
						},
						{
							type: 'actions',
							elements: [
								{
									type: 'button',
									text: { type: 'plain_text', text: 'Review in Dashboard' },
									url: reviewUrl,
								},
								{
									type: 'button',
									text: { type: 'plain_text', text: 'Visit Community' },
									url: communityUrl,
								},
							],
						},
					],
				},
			],
		}).catch((err) => console.error('Failed to post approval request to Slack', err));

		return res.status(200).send({ spamTag: community.spamTag.toJSON() });
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

		if (status === 'confirmed-spam') {
			const targetIsSuperAdmin = await isUserSuperAdmin({ userId });
			if (targetIsSuperAdmin) {
				return res
					.status(403)
					.json({ error: 'Cannot mark a platform administrator as spam' });
			}
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

		if (status === 'confirmed-spam' || status === 'confirmed-not-spam') {
			// notify community admins who filed bans about this user
			const resolution =
				status === 'confirmed-spam'
					? 'The user has been confirmed to violate our Terms of Service and Acceptable Use Policy, and has been banned.'
					: 'The user has been reviewed and confirmed as not violating our Terms of Service and Acceptable Use Policy. They remain banned in your community, but no further action is taken.';
			notifyBannersOfCommunityBanResolution(userId, user, resolution).catch((err) =>
				console.error('Failed to notify banners of resolution', err),
			);
		}

		// should schedule purges for all communities the user has commented on, ugh
		const communities = await getAffiliationForUserIds([userId]);
		const communitySubdomains = communities.get(userId)?.communitySubdomains;
		if (communitySubdomains) {
			for (const communitySubdomain of communitySubdomains) {
				schedulePurge(`${communitySubdomain}.pubpub.org`);
			}
		}

		return res.status(200).send({});
	}),
);

router.post('/api/spamTags/queryCommunitiesForSpam', async (req, res) => {
	const { offset, limit, searchTerm, status, ordering, approvalRequested } = req.body;
	const canQuery = await canManipulateSpamTags({
		userId: expect(req.user).id,
	});
	if (!canQuery) {
		throw new ForbiddenError();
	}
	const { communities, totalCount } = await queryCommunitiesForSpamManagement({
		offset: offset && parseInt(offset, 10),
		limit: limit && parseInt(limit, 10),
		ordering,
		searchTerm,
		status,
		approvalRequested: approvalRequested === true ? true : undefined,
	});
	return res.status(200).send({ communities, totalCount });
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
		hasCommunityBan,
		spamFieldsFilter,
	} = req.body;
	const canQuery = await canManipulateSpamTags({
		userId: expect(req.user).id,
	});
	if (!canQuery) {
		throw new ForbiddenError();
	}

	const parsedSpamFieldsFilter = (() => {
		if (Array.isArray(spamFieldsFilter)) {
			return { include: spamFieldsFilter as SpamFieldsFilterKey[] };
		}

		if (!spamFieldsFilter || typeof spamFieldsFilter !== 'object') {
			return undefined;
		}

		const filterObject = spamFieldsFilter as SpamFieldsFilter;
		const include = Array.isArray(filterObject.include)
			? (filterObject.include as SpamFieldsFilterKey[])
			: undefined;
		const exclude = Array.isArray(filterObject.exclude)
			? (filterObject.exclude as SpamFieldsFilterKey[])
			: undefined;

		if (!include?.length && !exclude?.length) {
			return undefined;
		}

		return { include, exclude };
	})();

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
		hasCommunityBan: !!hasCommunityBan,
		spamFieldsFilter: parsedSpamFieldsFilter,
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
