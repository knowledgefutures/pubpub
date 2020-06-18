import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';

import { getCreatePermission, getUpdatePermissions } from './permissions';
import { createDiscussion, updateDiscussion } from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		discussionId: req.body.discussionId || null,
		pubId: req.body.pubId,
		communityId: req.body.communityId,
		accessHash: req.body.accessHash,
		visibilityAccess: req.body.visibilityAccess,
	};
};

app.post(
	'/api/discussions',
	wrap(async (req, res) => {
		const requestIds = getRequestIds(req);
		const canCreate = await getCreatePermission(requestIds);
		if (!canCreate) {
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
		const permissions = await getUpdatePermissions(requestIds);
		const updatedValues = await updateDiscussion(req.body, permissions);
		return res.status(200).json(updatedValues);
	}),
);
