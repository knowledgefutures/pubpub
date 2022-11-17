import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';

import { getCreatePermission, getUpdatePermissions, canReleaseDiscussions } from './permissions';
import { createDiscussion, updateDiscussion, updateVisibilityForDiscussions } from './queries';
import { createDiscussionAnchorsForLatestRelease } from './utils';

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

app.post(
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

app.put(
	'/api/discussions',
	wrap(async (req, res) => {
		const requestIds = getRequestIds(req);
		const permissions = await getUpdatePermissions(requestIds);
		const updatedValues = await updateDiscussion(req.body, permissions);
		return res.status(200).json(updatedValues);
	}),
);

app.put(
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
