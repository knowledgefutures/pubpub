import app, { wrap } from '../server';
import { getPermissions } from './permissions';
import { createCommunityAdmin, destroyCommunityAdmin } from './queries';
import { ForbiddenError } from '../errors';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		communityId: req.body.communityId,
	};
};

app.post(
	'/api/communityAdmins',
	wrap(async (req, res) => {
		const permissions = await getPermissions(getRequestIds(req));
		if (!permissions.create) {
			throw new ForbiddenError();
		}
		const newCommunityAdmin = await createCommunityAdmin(req.body);
		return res.status(201).json(newCommunityAdmin);
	}),
);

app.delete(
	'/api/communityAdmins',
	wrap(async (req, res) => {
		const permissions = await getPermissions(getRequestIds(req));
		if (!permissions.destroy) {
			throw new ForbiddenError();
		}
		await destroyCommunityAdmin(req.body);
		return res.status(201).json(req.body.userId);
	}),
);
