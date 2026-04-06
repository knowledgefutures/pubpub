import { Router } from 'express';

import { Draft, Pub } from 'server/models';
import { wrap } from 'server/wrap';
import { expect } from 'utils/assert';

import { upsertDraftCheckpoint } from './queries';

export const router = Router();

router.post(
	'/api/draftCheckpoint',
	wrap(async (req, res) => {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).json({});
		}

		const { pubId, historyKey: rawHistoryKey, doc } = req.body;
		const historyKey =
			typeof rawHistoryKey === 'string' ? parseInt(rawHistoryKey, 10) : rawHistoryKey;
		if (!pubId || typeof historyKey !== 'number' || Number.isNaN(historyKey) || !doc) {
			return res.status(400).json({ error: 'Missing pubId, historyKey, or doc' });
		}

		// Look up the draft for this pub
		const pub = await Pub.findOne({
			where: { id: pubId },
			include: [{ model: Draft, as: 'draft' }],
		});
		if (!pub?.draft) {
			return res.status(404).json({ error: 'Pub or draft not found' });
		}

		const checkpoint = await upsertDraftCheckpoint(pub.draft.id, historyKey, doc, Date.now());

		return res.status(200).json({ id: checkpoint.id });
	}),
);
