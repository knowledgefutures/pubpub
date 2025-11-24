import { Router } from 'express';

import { getPubDraftDoc } from 'server/utils/firebaseAdmin';
import { wrap } from 'server/wrap';

import { getPermissions } from './permissions';
import { restorePubDraftToHistoryKey } from './queries';

export const router = Router();

const parseHistoryKey = (providedHistoryKey: any) => {
	const historyKeyInt = parseInt(providedHistoryKey, 10);
	return Number.isNaN(historyKeyInt) ? null : historyKeyInt;
};

const getRequestIds = (req) => {
	const user = req.user || {};
	const { pubId, communityId, historyKey: providedHistoryKey, accessHash } = req.query;
	const historyKey = parseHistoryKey(providedHistoryKey);
	return {
		userId: user.id,
		pubId,
		communityId,
		historyKey,
		accessHash,
	};
};

router.get(
	'/api/pubHistory',
	wrap(async (req, res) => {
		const { pubId, historyKey, accessHash, userId } = getRequestIds(req);
		const { canCreateExport } = await getPermissions({
			userId,
			pubId,
			accessHash,
			historyKey,
		});
		if (canCreateExport) {
			const draftDocInfo = await getPubDraftDoc(pubId, historyKey);
			return res.status(200).json(draftDocInfo);
		}
		return res.status(403).json({});
	}),
);

router.post(
	'/api/pubHistory/restore',
	wrap(async (req, res) => {
		const userId = req.user?.id;
		const { pubId, historyKey: providedHistoryKey, accessHash } = req.body;
		const historyKey = parseHistoryKey(providedHistoryKey);
		const { canRestoreHistory } = await getPermissions({
			userId,
			pubId,
			accessHash,
			historyKey,
		});
		if (canRestoreHistory && typeof historyKey === 'number') {
			await restorePubDraftToHistoryKey({ userId, pubId, historyKey });
			return res.status(200).json({});
		}
		return res.status(403).json({});
	}),
);
