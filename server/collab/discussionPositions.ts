import { Router } from 'express';

import { Draft, DraftCheckpoint, Pub } from 'server/models';
import { wrap } from 'server/wrap';

export const router = Router();

// get current discussion positions for a pub's draft
router.get(
	'/api/pubs/:pubId/discussions/positions',
	wrap(async (req, res) => {
		const pub = await Pub.findOne({
			where: { id: req.params.pubId },
			include: [{ model: Draft, as: 'draft' }],
			attributes: ['id'],
		});

		if (!pub?.draft) {
			return res.status(404).json({});
		}

		const checkpoint = await DraftCheckpoint.findOne({
			where: { draftId: pub.draft.id },
		});

		return res.status(200).json(checkpoint?.discussions ?? {});
	}),
);

// update discussion positions for a pub's draft
router.post(
	'/api/pubs/:pubId/discussions/positions',
	wrap(async (req, res) => {
		const pub = await Pub.findOne({
			where: { id: req.params.pubId },
			include: [{ model: Draft, as: 'draft' }],
			attributes: ['id'],
		});

		if (!pub?.draft) {
			return res.status(404).json({});
		}

		const discussions = req.body;

		if (!discussions || typeof discussions !== 'object') {
			return res.status(400).json({ error: 'Invalid discussions payload' });
		}

		const checkpoint = await DraftCheckpoint.findOne({
			where: { draftId: pub.draft.id },
		});

		if (checkpoint) {
			// merge incoming discussion positions with existing ones
			const existing = checkpoint.discussions ?? {};
			const merged = { ...existing, ...discussions };
			await checkpoint.update({ discussions: merged });
		}

		return res.status(204).send(null);
	}),
);
