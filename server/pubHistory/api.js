import app, { wrap } from 'server/server';
import { getBranchDoc } from 'server/utils/firebaseAdmin';

import { getPermissions } from './permissions';

const getRequestIds = (req) => {
	const user = req.user || {};
	const { pubId, communityId, branchId, historyKey, accessHash } = req.query;
	return {
		userId: user.id,
		pubId: pubId,
		communityId: communityId,
		branchId: branchId,
		historyKey: historyKey,
		accessHash: accessHash,
	};
};

app.get(
	'/api/pubHistory',
	wrap(async (req, res) => {
		const { branchId, pubId, communityId, historyKey, accessHash, userId } = getRequestIds(req);
		const { canCreateExport } = await getPermissions({
			userId: userId,
			communityId: communityId,
			pubId: pubId,
			branchId: branchId,
			accessHash: accessHash,
		});
		if (canCreateExport) {
			const branchInfo = await getBranchDoc(pubId, branchId, parseInt(historyKey, 10));
			return res.status(200).json(branchInfo);
		}
		return res.status(403).json({});
	}),
);
