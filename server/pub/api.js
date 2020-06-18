import app from 'server/server';

import { getPermissions } from './permissions';
import { createPub, updatePub, destroyPub } from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		communityId: req.body.communityId,
		pubId: req.body.pubId || null,
		licenseSlug: req.body.licenseSlug,
	};
};

app.post('/api/pubs', (req, res) => {
	const requestIds = getRequestIds(req);
	getPermissions(requestIds)
		.then((permissions) => {
			const { communityId, defaultCollectionIds } = req.body;
			if (!permissions.create) {
				throw new Error('Not Authorized');
			}
			return createPub(
				{ communityId: communityId, defaultCollectionIds: defaultCollectionIds },
				requestIds.userId,
			);
		})
		.then((newPub) => {
			return res.status(201).json(newPub);
		})
		.catch((err) => {
			console.error('Error in postPub: ', err);
			const statusCode = err.message === 'Not Authorized' ? 401 : 500;
			return res.status(statusCode).json(err.message);
		});
});

app.put('/api/pubs', (req, res) => {
	const requestIds = getRequestIds(req);
	getPermissions(requestIds)
		.then((permissions) => {
			if (!permissions.update) {
				throw new Error('Not Authorized');
			}
			return updatePub(req.body, permissions.update);
		})
		.then((updateResult) => {
			return res.status(201).json(updateResult);
		})
		.catch((err) => {
			console.error('Error in putPub: ', err);
			const statusCode = err.message === 'Not Authorized' ? 401 : 500;
			return res.status(statusCode).json(err.message);
		});
});

app.delete('/api/pubs', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.destroy) {
				throw new Error('Not Authorized');
			}
			return destroyPub(req.body);
		})
		.then(() => {
			return res.status(201).json(req.body.pubId);
		})
		.catch((err) => {
			console.error('Error in deletePub: ', err);
			const statusCode = err.message === 'Not Authorized' ? 401 : 500;
			return res.status(statusCode).json(err.message);
		});
});
