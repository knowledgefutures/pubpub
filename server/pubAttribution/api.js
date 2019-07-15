import app from '../server';
import { getPermissions } from './permissions';
import { createPubAttribution, updatePubAttribution, destroyPubAttribution } from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		communityId: req.body.communityId,
		pubId: req.body.pubId,
		pubAttributionId: req.body.id,
	};
};
/* Note: we typically use values like pubAttributionId on API requests */
/* here, id is sent up, so there is a little bit of kludge to make */
/* the other interfaces consistent. I didn't fully understand AttributionEditor */
/* so I didn't make the downstream change, which would be the right solution. */
app.post('/api/pubAttributions', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.create) {
				throw new Error('Not Authorized');
			}
			return createPubAttribution({
				...req.body,
				pubAttributionId: req.body.id,
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

app.put('/api/pubAttributions', (req, res) => {
	const requestIds = getRequestIds(req);
	getPermissions(requestIds)
		.then((permissions) => {
			if (!permissions.update) {
				throw new Error('Not Authorized');
			}
			return updatePubAttribution(
				{
					...req.body,
					pubAttributionId: req.body.id,
				},
				permissions.update,
			);
		})
		.then((updatedValues) => {
			return res.status(201).json(updatedValues);
		})
		.catch((err) => {
			console.error('Error in putPubAttribution: ', err);
			return res.status(500).json(err.message);
		});
});

app.delete('/api/pubAttributions', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.destroy) {
				throw new Error('Not Authorized');
			}
			return destroyPubAttribution({
				...req.body,
				pubAttributionId: req.body.id,
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
