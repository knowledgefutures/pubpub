import { Router } from 'express';

import { Community, User } from 'server/models';
import { notify } from 'server/spamTag/notifications';
import { canManipulateSpamTags } from 'server/spamTag/permissions';
import { upsertSpamTag } from 'server/spamTag/userQueries';
import { isUserSuperAdmin } from 'server/user/queries';
import { ForbiddenError, NotFoundError } from 'server/utils/errors';
import { getScope } from 'server/utils/queryHelpers';
import { wrap } from 'server/wrap';

import {
	createBan,
	getAllActiveBans,
	getBanById,
	getBanByIdAndActor,
	getBansForCommunity,
	updateBanStatus,
} from './queries';

export const router = Router();

router.post(
	'/api/communityBans',
	wrap(async (req, res) => {
		const { userId, communityId, reason, reasonText, sourceThreadCommentId } = req.body;
		const actorId = req.user?.id;
		if (!actorId || !userId || !communityId || !reason) {
			return res.status(400).send({ error: 'Missing required fields' });
		}

		const scopeData = await getScope({ communityId, loginId: actorId });
		if (!scopeData.activePermissions.canAdmin) {
			throw new ForbiddenError();
		}

		const targetIsSuperAdmin = await isUserSuperAdmin({ userId });
		if (targetIsSuperAdmin) {
			return res.status(403).json({ error: 'Cannot ban a platform administrator' });
		}

		const [bannedUser, actor, community, { spamTag }] = await Promise.all([
			User.findByPk(userId, { attributes: ['id', 'email', 'fullName', 'slug'] }),
			User.findByPk(actorId, { attributes: ['id', 'email', 'fullName', 'slug'] }),
			Community.findByPk(communityId, { attributes: ['subdomain'] }),
			upsertSpamTag({ userId }),
		]);

		const ban = await createBan({
			userId,
			communityId,
			actorId,
			reason,
			reasonText,
			sourceThreadCommentId,
			spamTagId: spamTag.id,
		});

		notify('community-flag', {
			userId,
			userEmail: bannedUser?.email ?? '',
			userName: bannedUser?.fullName ?? '',
			userSlug: bannedUser?.slug ?? '',
			communityId,
			communitySubdomain: community?.subdomain ?? '',
			actorFullName: actor?.fullName ?? '',
			actorSlug: actor?.slug ?? '',
			actorEmail: actor?.email ?? '',
			flagReason: reason,
			flagReasonText: reasonText,
			sourceThreadCommentId,
		}).catch((err) => console.error('Failed to send community flag notification', err));

		return res.status(201).json(ban);
	}),
);

router.put(
	'/api/communityBans/:id',
	wrap(async (req, res) => {
		const { status } = req.body;
		const banId = req.params.id;
		const actorId = req.user?.id;
		if (!actorId) throw new ForbiddenError();
		if (status !== 'retracted') {
			return res.status(400).json({ error: 'Only "retracted" is a valid status update' });
		}

		const ownBan = await getBanByIdAndActor(banId, actorId);
		if (!ownBan) {
			const existing = await getBanById(banId);
			if (!existing) throw new NotFoundError();
			const scopeData = await getScope({
				communityId: existing.communityId,
				loginId: actorId,
			});
			if (!scopeData.activePermissions.canAdmin) {
				throw new ForbiddenError();
			}
		}
		const updated = await updateBanStatus(banId, 'retracted', actorId);
		if (!updated) throw new NotFoundError();

		const retractedBan = await getBanById(banId);
		if (retractedBan) {
			const reqUser = req.user as any;
			notify('community-flag-retracted', {
				userId: retractedBan.userId,
				userEmail: retractedBan.user?.email ?? '',
				userName: retractedBan.user?.fullName ?? '',
				userSlug: retractedBan.user?.slug ?? '',
				communityId: retractedBan.communityId,
				communitySubdomain: retractedBan.community?.subdomain ?? '',
				actorFullName: reqUser?.fullName ?? '',
				actorSlug: reqUser?.slug ?? '',
				actorEmail: reqUser?.email ?? '',
			}).catch((err) => console.error('Failed to send flag retraction notification', err));
		}

		return res.status(200).json(updated);
	}),
);

router.get(
	'/api/communityBans',
	wrap(async (req, res) => {
		const communityId = req.query.communityId as string | undefined;
		const userId = req.user?.id;
		if (!userId) throw new ForbiddenError();

		if (communityId) {
			const scopeData = await getScope({ communityId, loginId: userId });
			if (!scopeData.activePermissions.canAdmin) {
				throw new ForbiddenError();
			}
			const bans = await getBansForCommunity(communityId);
			return res.status(200).json(bans);
		}

		const isSuperAdmin = await canManipulateSpamTags({ userId });
		if (!isSuperAdmin) throw new ForbiddenError();
		const bans = await getAllActiveBans();
		return res.status(200).json(bans);
	}),
);
