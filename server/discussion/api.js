import app, { wrap } from '../server';
import { getPermissions } from './permissions';
import { createDiscussion, updateDiscussion } from './queries';
import { ForbiddenError } from '../errors';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		threadId: req.body.threadId || null,
		threadCommentId: req.body.threadCommentId || null,
		pubId: req.body.pubId,
		collectionId: req.body.collectionId,
		communityId: req.body.communityId,
		branchId: req.body.branchId,
		accessHash: req.body.accessHash,
	};
};

app.post(
	'/api/discussions',
	wrap(async (req, res) => {
		const requestIds = getRequestIds(req);
		const permissions = await getPermissions(requestIds);
		if (!permissions.create) {
			throw new ForbiddenError();
		}
		const newDiscussion = await createDiscussion(req.body, req.user);
		return res.status(201).json(newDiscussion);
	}),
);

app.put(
	'/api/discussions',
	wrap(async (req, res) => {
		const requestIds = getRequestIds(req);
		const permissions = await getPermissions(requestIds);
		if (!permissions.update) {
			throw new ForbiddenError();
		}
		const updatedValues = await updateDiscussion(req.body, permissions.update);
		return res.status(200).json(updatedValues);
	}),
);
