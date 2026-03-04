import { Router } from 'express';

import { verifyCaptchaPayload } from 'server/utils/captcha';
import { BadRequestError, ForbiddenError } from 'server/utils/errors';
import { handleHoneypotTriggered, isHoneypotFilled } from 'server/utils/honeypot';
import { wrap } from 'server/wrap';

import { canReleaseDiscussions, getCreatePermission, getUpdatePermissions } from './permissions';
import { createDiscussion, updateDiscussion, updateVisibilityForDiscussions } from './queries';
import { createDiscussionAnchorsForLatestRelease } from './utils';

export const router = Router();

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		discussionId: req.body.discussionId || null,
		pubId: req.body.pubId,
		communityId: req.body.communityId,
		accessHash: req.body.accessHash,
		visibilityAccess: req.body.visibilityAccess,
		commentAccessHash: req.body.commentAccessHash,
	};
};

router.post(
	'/api/discussions',
	wrap(async (req, res) => {
		const requestIds = getRequestIds(req);
		const canCreate = await getCreatePermission(requestIds);
		if (!canCreate) {
			throw new ForbiddenError();
		}
		const userId = (req.user?.id as string) || null;
		const options = { ...req.body, userId };
		const newDiscussion = await createDiscussion(options);
		return res.status(201).json(newDiscussion);
	}),
);

router.post(
	'/api/discussions/fromForm',
	wrap(async (req, res) => {
		const requestIds = getRequestIds(req);
		const canCreate = await getCreatePermission(requestIds);
		if (!canCreate) {
			throw new ForbiddenError();
		}
		if (isHoneypotFilled(req.body)) {
			if (req.user?.id)
				await handleHoneypotTriggered(
					req.user.id,
					'create-discussion',
					req.body._honeypot,
					{
						communityId: req.body.communityId,
						pubId: req.body.pubId,
						content:
							typeof req.body.text === 'string'
								? req.body.text.slice(0, 500)
								: undefined,
					},
				);
			throw new BadRequestError(new Error('Invalid submission.'));
		}
		const ok = await verifyCaptchaPayload(req.body.altcha);
		if (!ok) {
			throw new BadRequestError(new Error('Please complete the verification and try again.'));
		}
		const userId = (req.user?.id as string) || null;
		const { altcha: _altcha, _honeypot, ...rest } = req.body;
		const options = { ...rest, userId };
		const newDiscussion = await createDiscussion(options);
		return res.status(201).json(newDiscussion);
	}),
);

router.put(
	'/api/discussions',
	wrap(async (req, res) => {
		const requestIds = getRequestIds(req);
		const permissions = await getUpdatePermissions(requestIds);
		const updatedValues = await updateDiscussion(req.body, permissions);
		return res.status(200).json(updatedValues);
	}),
);

router.put(
	'/api/discussions/release',
	wrap(async (req, res) => {
		const { pubId, discussionIds } = req.body;
		const userId = req.user?.id;
		const canRelease = await canReleaseDiscussions({ userId, pubId });
		if (!canRelease) {
			throw new ForbiddenError();
		}
		await Promise.all([
			updateVisibilityForDiscussions(pubId, discussionIds, 'public'),
			createDiscussionAnchorsForLatestRelease(pubId, discussionIds),
		]);
		return res.status(200).json({});
	}),
);
