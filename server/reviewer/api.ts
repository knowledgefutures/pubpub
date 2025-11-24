import { Router } from 'express';

import { wrap } from 'server/wrap';

import { getPermissions } from './permissions';
import { createReviewer } from './queries';

export const router = Router();

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		pubId: req.body.pubId,
		communityId: req.body.communityId,
	};
};

router.post(
	'/api/reviewer',
	wrap(async (req, res) => {
		const requestIds = getRequestIds(req);
		const { id, name, accessHash } = req.body;
		getPermissions(requestIds, accessHash)
			.then((permissions) => {
				if (!permissions.create) {
					throw new Error('Not Authorized');
				}
				return createReviewer({
					name,
					id,
				});
			})
			.then((newReview) => {
				return res.status(201).json(newReview);
			})
			.catch((err) => {
				console.error('Error in postReview: ', err);
				return res.status(500).json(err.message);
			});
	}),
);
