import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';

import { getPermissions } from './permissions';
import { createCommunity, updateCommunity } from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		communityId: req.body.communityId || null,
	};
};

app.post(
	'/api/communities',
	wrap(async (req, res) => {
		const requestIds = getRequestIds(req);
		const permissions = await getPermissions(requestIds);
		if (!permissions.create) {
			throw new ForbiddenError();
		}
		const newCommunity = await createCommunity(req.body, req.user);
		return res.status(201).json(`https://${newCommunity.subdomain}.pubpub.org`);
	}),
);

app.put(
	'/api/communities',
	wrap(async (req, res) => {
		const requestIds = getRequestIds(req);
		const permissions = await getPermissions(requestIds);
		if (!permissions.update) {
			throw new ForbiddenError();
		}
		const updatedValues = await updateCommunity(req.body, permissions.update);
		return res.status(200).json(updatedValues);
	}),
);
