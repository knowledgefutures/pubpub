import app from '../server';
import { getPermissions } from './permissions';
import { createCommunity, updateCommunity } from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		communityId: req.body.communityId || null,
	};
};

app.post('/api/communities', (req, res) => {
	const requestIds = getRequestIds(req);
	getPermissions(requestIds)
		.then((permissions) => {
			if (!permissions.create) {
				throw new Error('Not Authorized');
			}
			return createCommunity(req.body, req.user);
		})
		.then((newCommunity) => {
			return res.status(201).json(`https://${newCommunity.subdomain}.pubpub.org`);
		})
		.catch((err) => {
			console.error('Error in postCommunity: ', err);
			return res.status(500).json(err.message);
		});
});

app.put('/api/communities', (req, res) => {
	const requestIds = getRequestIds(req);
	getPermissions(requestIds)
		.then((permissions) => {
			if (!permissions.update) {
				throw new Error('Not Authorized');
			}
			return updateCommunity(req.body, permissions.update);
		})
		.then((updatedValues) => {
			return res.status(201).json(updatedValues);
		})
		.catch((err) => {
			console.error('Error in putCommunity: ', err);
			return res.status(500).json(err.message);
		});
});
