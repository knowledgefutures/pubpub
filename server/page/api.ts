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
			// @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 2.
			return createPage(req.body, req.user);
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
			// @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 0.
			throw new ForbiddenError();
		}
		const updatedValues = await updatePage(req.body, permissions.update);
		return res.status(201).json(updatedValues);
	}),
);

app.delete('/api/pages', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.destroy) {
				throw new Error('Not Authorized');
			}
			return destroyPage(req.body);
		})
		.then(() => {
			return res.status(201).json(req.body.pageId);
		})
		.catch((err) => {
			console.error('Error in deletePage: ', err);
			return res.status(500).json(err.message);
		});
});
