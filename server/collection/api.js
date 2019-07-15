import app from '../server';
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

app.post('/api/collections', (req, res) => {
	const requestIds = getRequestIds(req);
	getPermissions(requestIds)
		.then((permissions) => {
			if (!permissions.create) {
				throw new Error('Not Authorized');
			}
			return createCollection(
				{
					...req.body,
					collectionId: req.body.id,
				},
				req.user,
			);
		})
		.then((newCollection) => {
			return res.status(201).json(newCollection);
		})
		.catch((err) => {
			console.error('Error in postCollection: ', err);
			return res.status(500).json(err.message);
		});
});

app.put('/api/collections', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.update) {
				throw new Error('Not Authorized');
			}
			return updateCollection(
				{
					...req.body,
					collectionId: req.body.id,
				},
				permissions.update,
			);
		})
		.then((updatedValues) => {
			return res.status(201).json(updatedValues);
		})
		.catch((err) => {
			console.error('Error in putCollection: ', err);
			return res.status(500).json(err.message);
		});
});

app.delete('/api/collections', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.destroy) {
				throw new Error('Not Authorized');
			}
			return destroyCollection({
				...req.body,
				collectionId: req.body.id,
			});
		})
		.then(() => {
			return res.status(201).json(req.body.id);
		})
		.catch((err) => {
			console.error('Error in deleteCollection: ', err);
			return res.status(500).json(err.message);
		});
});
