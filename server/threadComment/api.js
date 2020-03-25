import app, { wrap } from '../server';
import { getPermissions } from './permissions';
import { createThreadComment, updateThreadComment } from './queries';
import { ForbiddenError } from '../errors';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		discussionId: req.body.discussionId,
		threadId: req.body.threadId,
		threadCommentId: req.body.threadCommentId || null,
		pubId: req.body.pubId,
		communityId: req.body.communityId,
		accessHash: req.body.accessHash,
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
		const newThreadComment = await createThreadComment(req.body, req.user);
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
