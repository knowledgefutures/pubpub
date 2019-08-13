import app, { wrap } from '../server';
import { getPermissions } from './permissions';
import { ForbiddenError } from '../errors';
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

app.post(
	'/api/branchPermissions',
	wrap(async (req, res) => {
		const permissions = await getPermissions(getRequestIds(req));
		if (!permissions.create) {
			throw new ForbiddenError();
		}
		const newBranchPermission = await createBranchPermission(req.body);
		return res.status(201).json(newBranchPermission);
	}),
);

app.put(
	'/api/branchPermissions',
	wrap(async (req, res) => {
		const permissions = await getPermissions(getRequestIds(req));
		if (!permissions.update) {
			throw new ForbiddenError();
		}
		const updatedBranchPermissionValues = await updateBranchPermission(
			req.body,
			permissions.update,
		);
		return res.status(200).json(updatedBranchPermissionValues);
	}),
);

app.delete(
	'/api/branchPermissions',
	wrap(async (req, res) => {
		const permissions = await getPermissions(getRequestIds(req));
		if (!permissions.destroy) {
			throw new ForbiddenError();
		}
		await destroyBranchPermission(req.body);
		return res.status(200).json(req.body.branchPermissionId);
	}),
);
