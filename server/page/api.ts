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

app.post('/api/pages', (req, res) => {
	const requestIds = getRequestIds(req);
	getPermissions(requestIds)
		.then((permissions) => {
			if (!permissions.create) {
				throw new Error('Not Authorized');
			}
			return createPage(req.body, req.user.id);
		})
		.then((newPage) => {
			return res.status(201).json(newPage);
		})
		.catch((err) => {
			console.error('Error in postPage: ', err);
			return res.status(500).json(err.message);
		});
});

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

app.delete('/api/pages', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.destroy) {
				throw new Error('Not Authorized');
			}
			return destroyPage(req.body, req.user.id);
		})
		.then(() => {
			return res.status(201).json(req.body.pageId);
		})
		.catch((err) => {
			console.error('Error in deletePage: ', err);
			return res.status(500).json(err.message);
		});
});
