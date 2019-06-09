import app from '../server';
import { getPermissions } from './permissions';
import { createPubManager, destroyPubManager } from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		communityId: req.body.communityId,
		pubId: req.body.pubId,
	};
};

app.post('/api/pubManagers', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.create) {
				throw new Error('Not Authorized');
			}
			return createPubManager(req.body);
		})
		.then((newPubManager) => {
			return res.status(201).json(newPubManager);
		})
		.catch((err) => {
			console.error('Error in postPubManager: ', err);
			return res.status(500).json(err.message);
		});
});

app.delete('/api/pubManagers', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.destroy) {
				throw new Error('Not Authorized');
			}
			return destroyPubManager(req.body);
		})
		.then(() => {
			return res.status(201).json(req.body.pubManagerId);
		})
		.catch((err) => {
			console.error('Error in deletePubManager: ', err);
			return res.status(500).json(err.message);
		});
});
