import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';

import { getPermissions } from './permissions';
import { createRelease, ReleaseQueryError } from './queries';

const getRequestValues = (req) => {
	const user = req.user || {};
	const { communityId, historyKey, noteContent, noteText, pubId } = req.body;
	return {
		communityId,
		historyKey,
		noteContent,
		noteText,
		pubId,
		userId: user.id,
	};
};

app.post(
	'/api/releases',
	wrap(async (req, res) => {
		const { communityId, historyKey, noteContent, noteText, pubId, userId } =
			getRequestValues(req);
		const permissions = await getPermissions({
			userId,
			pubId,
			communityId,
		});

		if (!permissions.create) {
			throw new ForbiddenError();
		}

		try {
			const release = await createRelease({
				userId,
				pubId,
				historyKey,
				noteText,
				noteContent,
			});

			return res.status(201).json(release);
		} catch (error) {
			if (error instanceof ReleaseQueryError) {
				return res.status(400).json(error.message);
			}
			throw error;
		}
	}),
);
