import app, { wrap } from '../server';
import { getPermissions } from './permissions';
import { createBranch, updateBranch, destroyBranch } from './queries';
import { ForbiddenError } from '../errors';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		communityId: req.body.communityId,
		pubId: req.body.pubId,
		branchId: req.body.branchId || null,
	};
};

app.post(
	'/api/branches',
	wrap(async (req, res) => {
		const requestIds = getRequestIds(req);
		const permissions = await getPermissions(requestIds);
		if (!permissions.create) {
			throw new ForbiddenError();
		}
		const newBranch = await createBranch(req.body, requestIds.userId);
		return res.status(201).json(newBranch);
	}),
);

app.put(
	'/api/branches',
	wrap(async (req, res) => {
		const requestIds = getRequestIds(req);
		const permissions = await getPermissions(requestIds);
		if (!permissions.update) {
			throw new ForbiddenError();
		}
		const updatedBranchValues = await updateBranch(req.body, permissions.update);
		return res.status(200).json(updatedBranchValues);
	}),
);

app.delete(
	'/api/branches',
	wrap(async (req, res) => {
		const requestIds = getRequestIds(req);
		const permissions = await getPermissions(requestIds);
		if (!permissions.destroy) {
			throw new ForbiddenError();
		}
		await destroyBranch(req.body);
		return res.status(200).json(req.body.branchId);
	}),
);
