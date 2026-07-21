import { Router } from 'express';
import { Op } from 'sequelize';

import { Commenter, Discussion, DiscussionAnchor, DraftCheckpoint } from 'server/models';
import { authorIncludes, baseVisibility, threadIncludes } from 'server/utils/queryHelpers/util';
import { wrap } from 'server/wrap';

import { getDraftIdForPub } from './api';

export const router = Router();

const isValidPositionEntry = (entry: any) =>
	entry &&
	typeof entry === 'object' &&
	typeof entry.currentKey === 'number' &&
	typeof entry.initKey === 'number' &&
	entry.selection;

// get current discussion positions for a pub's draft
router.get(
	'/api/pubs/:pubId/discussions/positions',
	wrap(async (req, res) => {
		const draftId = await getDraftIdForPub(req.params.pubId);

		if (!draftId) {
			return res.status(404).json({});
		}

		const checkpoint = await DraftCheckpoint.findOne({
			where: { draftId },
		});

		if (!checkpoint?.discussions) {
			return res.status(200).json({});
		}

		// filter out corrupted entries and auto-clean the checkpoint
		const raw = checkpoint.discussions as Record<string, any>;
		const clean: Record<string, any> = {};
		let needsCleanup = false;
		for (const [id, entry] of Object.entries(raw)) {
			if (isValidPositionEntry(entry)) {
				clean[id] = entry;
			} else {
				needsCleanup = true;
			}
		}

		if (needsCleanup) {
			await checkpoint.update({ discussions: clean });
		}

		return res.status(200).json(clean);
	}),
);

// fetch full discussion data (all or by IDs) for collab sync
router.get(
	'/api/pubs/:pubId/discussions',
	wrap(async (req, res) => {
		const ids = (req.query.ids as string)?.split(',').filter(Boolean);

		const where: any = { pubId: req.params.pubId };
		if (ids && ids.length > 0) {
			where.id = { [Op.in]: ids };
		}

		const discussions = await Discussion.findAll({
			where,
			include: [
				...authorIncludes(),
				{ model: DiscussionAnchor, as: 'anchors' },
				...baseVisibility,
				...threadIncludes(),
				{ model: Commenter, as: 'commenter' },
			],
		});

		return res.status(200).json(discussions);
	}),
);

// update discussion positions for a pub's draft
router.post(
	'/api/pubs/:pubId/discussions/positions',
	wrap(async (req, res) => {
		const draftId = await getDraftIdForPub(req.params.pubId);

		if (!draftId) {
			return res.status(404).json({});
		}

		const discussions = req.body;

		if (!discussions || typeof discussions !== 'object') {
			return res.status(400).json({ error: 'Invalid discussions payload' });
		}

		const checkpoint = await DraftCheckpoint.findOne({
			where: { draftId },
		});

		if (checkpoint) {
			const existing = checkpoint.discussions ?? {};
			const validated: Record<string, any> = {};
			for (const [id, entry] of Object.entries(discussions)) {
				if (isValidPositionEntry(entry)) {
					validated[id] = entry;
				}
			}
			const merged = { ...existing, ...validated };
			await checkpoint.update({ discussions: merged });
		}

		return res.status(204).send(null);
	}),
);
