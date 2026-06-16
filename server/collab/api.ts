import type { PresenceIndicator } from '@pitter-patter/presence-server';

import { TooMuchContentionError } from '@pitter-patter/collab-server';
import { Router } from 'express';

import { Draft, Pub } from 'server/models';
import { wrap } from 'server/wrap';

import { collabAuthority } from './authority';
import { presenceAuthority } from './presence';

export const router = Router();

const getDraftIdForPub = async (pubId: string): Promise<string | null> => {
	const pub = await Pub.findOne({
		where: { id: pubId },
		include: [{ model: Draft, as: 'draft' }],
		attributes: ['id'],
	});

	return pub?.draft?.id ?? null;
};

// receive a commit from a client
router.post(
	'/api/pubs/:pubId/commits',
	wrap(async (req, res) => {
		const draftId = await getDraftIdForPub(req.params.pubId);

		if (!draftId) {
			return res.status(404).json({ error: 'Pub or draft not found' });
		}

		try {
			await collabAuthority.receiveCommit(draftId, req.body);
		} catch (e) {
			if (e instanceof TooMuchContentionError) {
				return res.status(409).json(null);
			}
			throw e;
		}

		return res.status(204).send(null);
	}),
);

// long-poll for new commits
router.get(
	'/api/pubs/:pubId/commits',
	wrap(async (req, res) => {
		const draftId = await getDraftIdForPub(req.params.pubId);

		if (!draftId) {
			return res.status(404).json({ error: 'Pub or draft not found' });
		}

		const version = parseInt(req.query.version as string, 10);

		if (Number.isNaN(version)) {
			return res.status(400).json({ error: 'Missing or invalid version query parameter' });
		}

		const commits = await collabAuthority.listenForCommit(draftId, version);
		return res.status(200).json(commits);
	}),
);

// update presence indicator
router.post(
	'/api/pubs/:pubId/presence/:clientId',
	wrap(async (req, res) => {
		const indicator = req.body as PresenceIndicator;
		await presenceAuthority.updatePresence(req.params.pubId, indicator);
		return res.status(204).send(null);
	}),
);

// long-poll for presence updates
router.post(
	'/api/pubs/:pubId/presence',
	wrap(async (req, res) => {
		const { refs, clientId } = req.body as {
			refs: Record<string, string> | undefined;
			clientId: string;
		};

		const presence = await presenceAuthority.listenForPresence(
			req.params.pubId,
			clientId,
			refs,
		);

		return res.status(200).json(presence);
	}),
);
