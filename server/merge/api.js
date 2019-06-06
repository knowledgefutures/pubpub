import app from '../server';
import { getPermissions } from './permissions';
import { createMerge, updateMerge, destroyMerge } from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		communityId: req.body.communityId,
		pubId: req.body.pubId,
		mergeId: req.body.reviewId || null,
		reviewId: req.body.reviewId || null,
		sourceBranchId: req.body.sourceBranchId,
		destinationBranchId: req.body.destinationBranchId,
	};
};

app.post('/api/merges', (req, res) => {
	const requestIds = getRequestIds(req);
	getPermissions(requestIds)
		.then((permissions) => {
			if (!permissions.create) {
				throw new Error('Not Authorized');
			}
			return createMerge(req.body, requestIds.userId);
		})
		.then((newMerge) => {
			return res.status(201).json(newMerge);
		})
		.catch((err) => {
			console.error('Error in postMerge: ', err);
			return res.status(500).json(err.message);
		});
});

app.put('/api/merges', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.update) {
				throw new Error('Not Authorized');
			}
			return updateMerge(req.body, permissions.update);
		})
		.then((updatedMergeValues) => {
			return res.status(201).json(updatedMergeValues);
		})
		.catch((err) => {
			console.error('Error in putMerge: ', err);
			return res.status(500).json(err.message);
		});
});

app.delete('/api/merges', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.destroy) {
				throw new Error('Not Authorized');
			}
			return destroyMerge(req.body);
		})
		.then(() => {
			return res.status(201).json(req.body.mergeId);
		})
		.catch((err) => {
			console.error('Error in deleteMerge: ', err);
			return res.status(500).json(err.message);
		});
});
