import app, { wrap } from 'server/server';
import { createReviewer } from './queries';
import { getPermissions } from './permissions';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		pubId: req.body.pubId,
		communityId: req.body.communityId,
	};
};

app.post(
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
