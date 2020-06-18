import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';

import { setDoiData } from './queries';
import { getPermissions } from './permissions';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		communityId: req.body.communityId,
		collectionId: req.body.collectionId || null,
		pubId: req.body.pubId || null,
	};
};

app.post(
	'/api/doi/:target',
	wrap(async (req, res) => {
		const requestIds = getRequestIds(req);
		const { pubId, collectionId, communityId } = req.body;
		const { target } = req.params;
		const permissions = await getPermissions(requestIds);
		const isAuthenticated =
			(target === 'pub' && permissions.pub) ||
			(target === 'collection' && permissions.collection);
		if (!isAuthenticated) {
			throw new ForbiddenError();
		}
		const doiJson = await setDoiData(
			{
				communityId: communityId,
				collectionId: collectionId,
				pubId: pubId,
			},
			target,
		);
		return res.status(201).json(doiJson);
	}),
);
