import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';

import { getOrStartExportTask } from './queries';
import { getPermissions } from './permissions';

const getRequestData = (req) => {
	const user = req.user || {};
	const { accessHash, format, historyKey, pubId, communityId } = req.body;
	return {
		accessHash: accessHash,
		format: format,
		historyKey: historyKey,
		pubId: pubId,
		communityId: communityId,
		userId: user.id,
	};
};

app.post(
	'/api/export',
	wrap(async (req, res) => {
		const { accessHash, format, historyKey, pubId, userId, communityId } = getRequestData(req);
		const permissions = await getPermissions({
			accessHash: accessHash,
			userId: userId,
			pubId: pubId,
			communityId: communityId,
			historyKey: historyKey,
		});

		if (!permissions.create) {
			throw new ForbiddenError();
		}

		const result = await getOrStartExportTask({
			format: format,
			historyKey: historyKey,
			pubId: pubId,
		});

		return res.status(201).json(result);
	}),
);
