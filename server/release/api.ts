import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';

import { getPermissions } from './permissions';
import { createRelease } from './queries';

const getRequestValues = (req) => {
	const user = req.user || {};
	const {
		communityId,
		draftKey,
		makeDraftDiscussionsPublic,
		noteContent,
		noteText,
		pubId,
	} = req.body;
	return {
		communityId: communityId,
		draftKey: draftKey,
		makeDraftDiscussionsPublic: makeDraftDiscussionsPublic,
		noteContent: noteContent,
		noteText: noteText,
		pubId: pubId,
		userId: user.id,
	};
};

app.post(
	'/api/releases',
	wrap(async (req, res) => {
		const {
			communityId,
			draftKey,
			makeDraftDiscussionsPublic,
			noteContent,
			noteText,
			pubId,
			userId,
		} = getRequestValues(req);
		const permissions = await getPermissions({
			userId: userId,
			pubId: pubId,
			communityId: communityId,
		});

		if (!permissions.create) {
			// @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 0.
			throw new ForbiddenError();
		}

		const release = await createRelease({
			userId: userId,
			pubId: pubId,
			draftKey: draftKey,
			noteText: noteText,
			noteContent: noteContent,
			makeDraftDiscussionsPublic: makeDraftDiscussionsPublic,
		});

		return res.status(201).json(release);
	}),
);
