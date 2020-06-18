import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';

import { getPermissions } from './permissions';
import { createCollection, updateCollection, destroyCollection } from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		communityId: req.body.communityId,
		collectionId: req.body.id || null,
	};
};

app.post(
	'/api/collections',
	wrap(async (req, res) => {
		const requestIds = getRequestIds(req);
		const permissions = await getPermissions(requestIds);
		if (!permissions.create) {
			throw new ForbiddenError();
		}
		const newCollection = await createCollection(req.body, req.user);
		return res.status(201).json(newCollection);
	}),
);

app.put(
	'/api/collections',
	wrap(async (req, res) => {
		const permissions = await getPermissions(getRequestIds(req));
		if (!permissions.update) {
			throw new ForbiddenError();
		}
		const updatedValues = await updateCollection(
			{
				...req.body,
				collectionId: req.body.id,
			},
			permissions.update,
		);
		return res.status(200).json(updatedValues);
	}),
);

app.delete(
	'/api/collections',
	wrap(async (req, res) => {
		const permissions = await getPermissions(getRequestIds(req));
		if (!permissions.update) {
			throw new ForbiddenError();
		}
		await destroyCollection({
			...req.body,
			collectionId: req.body.id,
		});
		return res.status(200).json(req.body.id);
	}),
);
