import app from '../server';
import { getPermissions } from './permissions';
import { createDiscussion, updateDiscussion } from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		discussionId: req.body.communityId || null,
		pubId: req.body.pubId,
		communityId: req.body.communityId,
	};
};

app.post('/api/discussions', (req, res) => {
	const requestIds = getRequestIds(req);
	getPermissions(requestIds)
		.then((permissions) => {
			if (!permissions.create) {
				throw new Error('Not Authorized');
			}
			return createDiscussion(req.body, req.user);
		})
		.then((newDiscussion) => {
			return res.status(201).json(newDiscussion);
		})
		.catch((err) => {
			console.error('Error in postDiscussion: ', err);
			return res.status(500).json(err.message);
		});
});

app.put('/api/discussions', (req, res) => {
	const requestIds = getRequestIds(req);
	getPermissions(requestIds)
		.then((permissions) => {
			if (!permissions.update) {
				throw new Error('Not Authorized');
			}
			return updateDiscussion(req.body, permissions.update);
		})
		.then((updatedValues) => {
			return res.status(201).json(updatedValues);
		})
		.catch((err) => {
			console.error('Error in pubDiscussion: ', err);
			return res.status(500).json(err.message);
		});
});
