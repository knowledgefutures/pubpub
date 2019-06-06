import app from '../server';
import { getPermissions } from './permissions';
import { createReviewEvent, updateReviewEvent, destroyReviewEvent } from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		communityId: req.body.communityId,
		pubId: req.body.pubId,
		reviewId: req.body.reviewId,
		reviewEventId: req.body.reviewEventId || null,
	};
};

app.post('/api/reviewEvents', (req, res) => {
	const requestIds = getRequestIds(req);
	getPermissions(requestIds)
		.then((permissions) => {
			if (!permissions.create) {
				throw new Error('Not Authorized');
			}
			return createReviewEvent(req.body, requestIds.userId);
		})
		.then((newReviewEvent) => {
			return res.status(201).json(newReviewEvent);
		})
		.catch((err) => {
			console.error('Error in postReviewEvent: ', err);
			return res.status(500).json(err.message);
		});
});

app.put('/api/reviewEvents', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.update) {
				throw new Error('Not Authorized');
			}
			return updateReviewEvent(req.body, permissions.update);
		})
		.then((updatedReviewEventValues) => {
			return res.status(201).json(updatedReviewEventValues);
		})
		.catch((err) => {
			console.error('Error in putReviewEvent: ', err);
			return res.status(500).json(err.message);
		});
});

app.delete('/api/reviewEvents', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.destroy) {
				throw new Error('Not Authorized');
			}
			return destroyReviewEvent(req.body);
		})
		.then(() => {
			return res.status(201).json(req.body.reviewEventId);
		})
		.catch((err) => {
			console.error('Error in deleteReviewEvent: ', err);
			return res.status(500).json(err.message);
		});
});
