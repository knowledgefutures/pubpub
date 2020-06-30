import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';

import { getPermissions } from './permissions';
import { createRelease } from './queries';

const getRequestValues = (req) => {
	const user = req.user || {};
	const {
		communityId,
		pubId,
		draftKey,
		noteText,
		noteContent,
		makeDraftDiscussionsPublic,
	} = req.body;
	return {
		userId: user.id,
		communityId: communityId,
		pubId: pubId,
		draftKey: draftKey,
		noteText: noteText,
		noteContent: noteContent,
		makeDraftDiscussionsPublic: makeDraftDiscussionsPublic,
	};
};

app.post(
	'/api/releases',
	wrap(async (req, res) => {
		const {
			userId,
			communityId,
			pubId,
			draftKey,
			noteText,
			noteContent,
			makeDraftDiscussionsPublic,
		} = getRequestValues(req);
		const permissions = await getPermissions({
			userId: userId,
			pubId: pubId,
			communityId: communityId,
		});

		if (!permissions.create) {
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

		return res.status(201).json({ release: release });
	}),
);
