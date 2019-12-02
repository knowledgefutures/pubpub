import app, { wrap } from '../server';
import { ForbiddenError } from '../errors';

import { getOrStartExportTask } from './queries';
import { getPermissions } from './permissions';

const getRequestData = (req) => {
	const user = req.user || {};
	const { accessHash, branchId, format, historyKey, pubId } = req.body;
	return {
		accessHash: accessHash,
		branchId: branchId,
		format: format,
		historyKey: historyKey,
		pubId: pubId,
		userId: user.id,
	};
};

app.post(
	'/api/export',
	wrap(async (req, res) => {
		const { accessHash, branchId, format, historyKey, pubId, userId } = getRequestData(req);
		const permissions = await getPermissions({
			accessHash: accessHash,
			branchId: branchId,
			userId: userId,
		});

		if (!permissions.create) {
			throw new ForbiddenError();
		}

		const result = await getOrStartExportTask({
			branchId: branchId,
			format: format,
			historyKey: historyKey,
			pubId: pubId,
		});

		return res.status(201).json(result);
	}),
);
