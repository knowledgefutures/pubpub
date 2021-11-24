import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';

import { getPermissions } from './permissions';
import { createPage, updatePage, destroyPage } from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		communityId: req.body.communityId,
		pubId: req.body.pubId,
		pageId: req.body.pageId || null,
	};
};

app.post(
	'/api/pages',
	wrap(async (req, res) => {
		const requestIds = getRequestIds(req);
		const permissions = await getPermissions(requestIds);
		if (!permissions.create) {
			throw new ForbiddenError();
		}
		const newPage = await createPage(req.body, req.user.id);
		return res.status(201).json(newPage);
	}),
);

app.put(
	'/api/pages',
	wrap(async (req, res) => {
		const ids = getRequestIds(req);
		const permissions = await getPermissions(ids);
		if (!permissions.update) {
			throw new ForbiddenError();
		}
		const updatedValues = await updatePage(req.body, permissions.update, req.user.id);
		return res.status(201).json(updatedValues);
	}),
);

app.delete(
	'/api/pages',
	wrap(async (req, res) => {
		const ids = getRequestIds(req);
		const permissions = await getPermissions(ids);
		if (!permissions.update) {
			throw new ForbiddenError();
		}
		await destroyPage(req.body, req.user.id);
		return res.status(201).json(req.body.pageId);
	}),
);
