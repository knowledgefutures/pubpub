import app from '../server';
import { getPermissions } from './permissions';
import {
	createCollectionPub,
	updateCollectionPub,
	setPrimaryCollectionPub,
	destroyCollectionPub,
} from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		collectionId: req.body.collectionId,
		communityId: req.body.communityId,
	};
};

app.post('/api/collectionPubs', (req, res) => {
	const requestIds = getRequestIds(req);
	getPermissions(requestIds)
		.then((permissions) => {
			if (!permissions.create) {
				throw new Error('Not Authorized');
			}
			return createCollectionPub(req.body);
		})
		.then((newPage) => {
			return res.status(201).json(newPage);
		})
		.catch((err) => {
			console.error('Error in postCollectionPub: ', err);
			return res.status(500).json(err.message);
		});
});

app.put('/api/collectionPubs/setPrimary', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.setPrimary) {
				throw new Error('Not Authorized');
			}
			return setPrimaryCollectionPub({
				...req.body,
				collectionPubId: req.body.id,
			});
		})
		.then((updatedValues) => {
			return res.status(201).json(updatedValues);
		})
		.catch((err) => {
			console.error('Error in setPrimaryCollectionPub: ', err);
			return res.status(500).json(err.message);
		});
});

app.put('/api/collectionPubs', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.update) {
				throw new Error('Not Authorized');
			}
			return updateCollectionPub(
				{
					...req.body,
					collectionPubId: req.body.id,
				},
				permissions.update,
			);
		})
		.then((updatedValues) => {
			return res.status(201).json(updatedValues);
		})
		.catch((err) => {
			console.error('Error in putCollectionPub: ', err);
			return res.status(500).json(err.message);
		});
});

app.delete('/api/collectionPubs', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.destroy) {
				throw new Error('Not Authorized');
			}
			return destroyCollectionPub({
				...req.body,
				collectionPubId: req.body.id,
			});
		})
		.then(() => {
			return res.status(201).json(req.body.id);
		})
		.catch((err) => {
			console.error('Error in deleteCollectionPub: ', err);
			return res.status(500).json(err.message);
		});
});
