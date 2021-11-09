import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';

import { getPermissions, canUpdate } from './permissions';
import { createSubmission, updateSubmission, destroySubmission } from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		id: req.body.id || null,
		userId: user.id,
		communityId: req.body.communityId,
		collectionId: req.body.collectionId,
	};
};

app.post(
	'/api/submissions',
	wrap(async (req, res) => {
		const ids = getRequestIds(req);
		const permissions = await getPermissions(ids);
		if (!permissions.create) {
			throw new ForbiddenError();
		}
		const newSubmission = await createSubmission(req.body);
		return res.status(201).json(newSubmission);
	}),
);

app.put(
	'/api/submissions',
	wrap(async (req, res) => {
		const ids = getRequestIds(req);
		const { status } = req.body;
		if (!(await canUpdate({ ...ids, status }))) {
			throw new ForbiddenError();
		}
		const updatedValues = await updateSubmission(req.body);
		return res.status(201).json(updatedValues);
	}),
);

app.delete(
	'/api/submissions',
	wrap(async (req, res) => {
		const ids = getRequestIds(req);
		const permissions = await getPermissions(ids);
		if (!permissions.destroy) {
			throw new ForbiddenError();
		}
		await destroySubmission(req.body);
		return res.status(200).json(req.body.id);
	}),
);
