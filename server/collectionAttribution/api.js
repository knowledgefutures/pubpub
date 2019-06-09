import app from '../server';
import { getPermissions } from './permissions';
import {
	createCollectionAttribution,
	updateCollectionAttribution,
	destroyCollectionAttribution,
} from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		communityId: req.body.communityId,
		collectionId: req.body.collectionId,
		collectionAttributionId: req.body.id,
	};
};
/* Note: we typically use values like collectionAttributionId on API requests */
/* here, id is sent up, so there is a little bit of kludge to make */
/* the other interfaces consistent. I didn't fully understand AttributionEditor */
/* so I didn't make the downstream change, which would be the right solution. */
app.post('/api/collectionAttributions', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.create) {
				throw new Error('Not Authorized');
			}
			return createCollectionAttribution({
				...req.body,
				collectionAttributionId: req.body.id,
			});
		})
		.then((newPubAttribution) => {
			return res.status(201).json(newPubAttribution);
		})
		.catch((err) => {
			console.error('Error in postPubAttribution: ', err);
			return res.status(500).json(err.message);
		});
});

app.put('/api/collectionAttributions', (req, res) => {
	const requestIds = getRequestIds(req);
	getPermissions(requestIds)
		.then((permissions) => {
			if (!permissions.update) {
				throw new Error('Not Authorized');
			}
			return updateCollectionAttribution(
				{
					...req.body,
					collectionAttributionId: req.body.id,
				},
				permissions.update,
			);
		})
		.then((updatedValues) => {
			return res.status(201).json(updatedValues);
		})
		.catch((err) => {
			console.error('Error in putCollectionAttribution: ', err);
			return res.status(500).json(err.message);
		});
});

app.delete('/api/collectionAttributions', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.destroy) {
				throw new Error('Not Authorized');
			}
			return destroyCollectionAttribution({
				...req.body,
				collectionAttributionId: req.body.id,
			});
		})
		.then(() => {
			return res.status(201).json(req.body.id);
		})
		.catch((err) => {
			console.error('Error in deletePubAttribution: ', err);
			return res.status(500).json(err.message);
		});
});
