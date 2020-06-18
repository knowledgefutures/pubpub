import app from 'server/server';

import { getPermissions } from './permissions';
import { createThreadEvent, updateThreadEvent, destroyThreadEvent } from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		communityId: req.body.communityId,
		pubId: req.body.pubId,
		threadId: req.body.threadId,
		threadEventId: req.body.threadEventId || null,
	};
};

app.post('/api/threadEvents', (req, res) => {
	const requestIds = getRequestIds(req);
	getPermissions(requestIds)
		.then((permissions) => {
			if (!permissions.create) {
				throw new Error('Not Authorized');
			}
			return createThreadEvent(req.body, req.user);
		})
		.then((newThreadEvent) => {
			return res.status(201).json(newThreadEvent);
		})
		.catch((err) => {
			console.error('Error in postThreadEvent: ', err);
			return res.status(500).json(err.message);
		});
});

app.put('/api/threadEvents', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.update) {
				throw new Error('Not Authorized');
			}
			return updateThreadEvent(req.body, permissions.update);
		})
		.then((updatedThreadEventValues) => {
			return res.status(201).json(updatedThreadEventValues);
		})
		.catch((err) => {
			console.error('Error in putThreadEvent: ', err);
			return res.status(500).json(err.message);
		});
});

app.delete('/api/threadEvents', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.destroy) {
				throw new Error('Not Authorized');
			}
			return destroyThreadEvent(req.body);
		})
		.then(() => {
			return res.status(201).json(req.body.threadEventId);
		})
		.catch((err) => {
			console.error('Error in deleteThreadEvent: ', err);
			return res.status(500).json(err.message);
		});
});
