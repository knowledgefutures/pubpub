import app from '../server';
import { getPermissions } from './permissions';
import { createCommunityAdmin, destroyCommunityAdmin } from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		communityId: req.body.communityId,
	};
};

app.post('/api/communityAdmins', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.create) {
				throw new Error('Not Authorized');
			}
			return createCommunityAdmin(req.body);
		})
		.then((newBranchPermission) => {
			return res.status(201).json(newBranchPermission);
		})
		.catch((err) => {
			console.error('Error in postCommunityAdmin: ', err);
			return res.status(500).json(err.message);
		});
});

app.delete('/api/communityAdmins', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.destroy) {
				throw new Error('Not Authorized');
			}
			return destroyCommunityAdmin(req.body);
		})
		.then(() => {
			return res.status(201).json(req.body.userId);
		})
		.catch((err) => {
			console.error('Error in deleteCommunityAdmin: ', err);
			return res.status(500).json(err.message);
		});
});
