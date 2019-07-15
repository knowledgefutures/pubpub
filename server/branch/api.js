import app from '../server';
import { getPermissions } from './permissions';
import { createBranch, updateBranch, destroyBranch } from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		communityId: req.body.communityId,
		pubId: req.body.pubId,
		branchId: req.body.branchId || null,
	};
};

app.post('/api/branches', (req, res) => {
	const requestIds = getRequestIds(req);
	getPermissions(requestIds)
		.then((permissions) => {
			if (!permissions.create) {
				throw new Error('Not Authorized');
			}
			return createBranch(req.body, requestIds.userId);
		})
		.then((newBranch) => {
			return res.status(201).json(newBranch);
		})
		.catch((err) => {
			console.error('Error in postBranch: ', err);
			return res.status(500).json(err.message);
		});
});

app.put('/api/branches', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.update) {
				throw new Error('Not Authorized');
			}
			return updateBranch(req.body, permissions.update);
		})
		.then((updatedBranchValues) => {
			return res.status(201).json(updatedBranchValues);
		})
		.catch((err) => {
			console.error('Error in putBranch: ', err);
			return res.status(500).json(err.message);
		});
});

app.delete('/api/branches', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.destroy) {
				throw new Error('Not Authorized');
			}
			return destroyBranch(req.body);
		})
		.then(() => {
			return res.status(201).json(req.body.branchId);
		})
		.catch((err) => {
			console.error('Error in deleteBranch: ', err);
			return res.status(500).json(err.message);
		});
});
