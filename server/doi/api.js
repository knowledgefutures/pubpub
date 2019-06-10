import app from '../server';
import { setDoiData } from './handler';
import { getPermissions } from './permissions';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		communityId: req.body.communityId,
		pubId: req.body.pubId || null,
	};
};

app.post('/api/doi/:target', (req, res) => {
	const requestIds = getRequestIds(req);
	const { pubId, collectionId, communityId } = req.body;
	const { target } = req.params;
	return getPermissions(requestIds)
		.then((permissions) => {
			const isAuthenticated =
				(target === 'pub' && permissions.pub) ||
				(target === 'collection' && permissions.collection);
			if (isAuthenticated) {
				return setDoiData(
					{
						communityId: communityId,
						collectionId: collectionId,
						pubId: pubId,
					},
					target,
				);
			}
			throw new Error('Invalid DOI target');
		})
		.then((doiJson) => {
			return res.status(201).json(doiJson);
		})
		.catch((err) => {
			console.error('Error in postDoi: ', err);
			return res.status(500).json(err.message);
		});
});
