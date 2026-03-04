import { Router } from 'express';

import { verifyCaptchaPayload } from 'server/utils/captcha';
import { BadRequestError, ForbiddenError } from 'server/utils/errors';
import { handleHoneypotTriggered, isHoneypotFilled } from 'server/utils/honeypot';
import { wrap } from 'server/wrap';

import { getPermissions } from './permissions';
import { createThreadComment, updateThreadComment } from './queries';

export const router = Router();

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		parentId: req.body.parentId,
		threadId: req.body.threadId,
		threadCommentId: req.body.threadCommentId || null,
		pubId: req.body.pubId,
		communityId: req.body.communityId,
		accessHash: req.body.accessHash,
		commentAccessHash: req.body.commentAccessHash,
	};
};

router.post(
	'/api/threadComment',
	wrap(async (req, res) => {
		const requestIds = getRequestIds(req);
		const permissions = await getPermissions(requestIds);
		if (!permissions.create) {
			throw new ForbiddenError();
		}
		const userId = (req.user?.id as string) || null;
		const options = { ...req.body, userId };
		const newThreadComment = await createThreadComment(options);
		return res.status(201).json(newThreadComment);
	}),
);

router.post(
	'/api/threadComment/fromForm',
	wrap(async (req, res) => {
		const requestIds = getRequestIds(req);
		const permissions = await getPermissions(requestIds);
		if (!permissions.create) {
			throw new ForbiddenError();
		}
		if (isHoneypotFilled(req.body)) {
			if (req.user?.id)
				await handleHoneypotTriggered(
					req.user.id,
					'create-thread-comment',
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
		const newThreadComment = await createThreadComment(options);
		return res.status(201).json(newThreadComment);
	}),
);

router.put(
	'/api/threadComment',
	wrap(async (req, res) => {
		const requestIds = getRequestIds(req);
		const permissions = await getPermissions(requestIds);
		if (!permissions.update) {
			throw new ForbiddenError();
		}
		const updatedValues = await updateThreadComment(req.body, permissions.update);
		return res.status(200).json(updatedValues);
	}),
);
