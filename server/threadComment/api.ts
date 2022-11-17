import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';

import { getPermissions } from './permissions';
import { createThreadComment, updateThreadComment } from './queries';

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

app.post(
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

app.put(
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
