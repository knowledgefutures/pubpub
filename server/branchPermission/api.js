import app from '../server';
import { getPermissions } from './permissions';
import { createBranchPermission, updateBranchPermission, destroyBranchPermission } from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		communityId: req.body.communityId,
		pubId: req.body.pubId,
		branchId: req.body.branchId,
	};
};

app.post('/api/branchPermissions', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.create) {
				throw new Error('Not Authorized');
			}
			return createBranchPermission(req.body);
		})
		.then((newBranchPermission) => {
			return res.status(201).json(newBranchPermission);
		})
		.catch((err) => {
			console.error('Error in postBranchPermission: ', err);
			return res.status(500).json(err.message);
		});
});

app.put('/api/branchPermissions', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.update) {
				throw new Error('Not Authorized');
			}
			return updateBranchPermission(req.body, permissions.update);
		})
		.then((updatedBranchPermissionValues) => {
			return res.status(201).json(updatedBranchPermissionValues);
		})
		.catch((err) => {
			console.error('Error in putBranchPermission: ', err);
			return res.status(500).json(err.message);
		});
});

app.delete('/api/branchPermissions', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.destroy) {
				throw new Error('Not Authorized');
			}
			return destroyBranchPermission(req.body);
		})
		.then(() => {
			return res.status(201).json(req.body.branchPermissionId);
		})
		.catch((err) => {
			console.error('Error in deleteBranch: ', err);
			return res.status(500).json(err.message);
		});
});
