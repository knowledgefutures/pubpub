import app from 'server/server';
import { expect } from 'utils/assert';

import { getPermissions } from './permissions';
import { createReview, createReviewRelease, updateReview, destroyReview } from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		communityId: req.body.communityId,
		pubId: req.body.pubId,
		reviewId: req.body.reviewId || null,
		reviewAccessHash: req.body.reviewAccessHash,
	};
};

app.post('/api/reviews', (req, res) => {
	const requestIds = getRequestIds(req);
	getPermissions(requestIds)
		.then((permissions) => {
			if (!permissions.create) {
				throw new Error('Not Authorized');
			}
			const { pubId, title, releaseRequested, reviewContent, text, content, reviewerName } =
				req.body;

			return createReview({
				pubId,
				title,
				releaseRequested,
				reviewContent,
				text,
				content,
				reviewerName,
				userData: expect(req.user),
			});
		})
		.then((newReview) => {
			return res.status(201).json(newReview);
		})
		.catch((err) => {
			console.error('Error in postReview: ', err);
			return res.status(500).json(err.message);
		});
});

app.post('/api/reviews/release', (req, res) => {
	const requestIds = getRequestIds(req);
	getPermissions(requestIds)
		.then((permissions) => {
			if (!permissions.createRelease) {
				throw new Error('Not Authorized');
			}
			return createReviewRelease(req.body, req.user);
		})
		.then((reviewReleaseData) => {
			return res.status(201).json(reviewReleaseData);
		})
		.catch((err) => {
			console.error('Error in postReview: ', err);
			return res.status(500).json(err.message);
		});
});

app.put('/api/reviews', (req, res) => {
	const requestIds = getRequestIds(req);
	getPermissions(requestIds)
		.then((permissions) => {
			if (!permissions.update) {
				throw new Error('Not Authorized');
			}
			return updateReview(req.body, permissions.update, req.user);
		})
		.then((updateResult) => {
			return res.status(201).json(updateResult);
		})
		.catch((err) => {
			console.error('Error in putReview: ', err);
			return res.status(500).json(err.message);
		});
});

app.delete('/api/reviews', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.destroy) {
				throw new Error('Not Authorized');
			}
			return destroyReview(req.body);
		})
		.then(() => {
			return res.status(201).json(req.body.reviewId);
		})
		.catch((err) => {
			console.error('Error in deleteReview: ', err);
			return res.status(500).json(err.message);
		});
});
