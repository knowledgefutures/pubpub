import type { PresenceIndicator } from '@pitter-patter/presence-server';

import { TooMuchContentionError } from '@pitter-patter/collab-server';
import { Router } from 'express';
import { Op } from 'sequelize';

import { CollabCommit, Draft, Pub } from 'server/models';
import { wrap } from 'server/wrap';

import { getCollabAuthority } from './authority';
import { getPresenceAuthority } from './presence';

export const router = Router();

const draftIdCache = new Map<string, string>();

export const getDraftIdForPub = async (pubId: string): Promise<string | null> => {
	const cached = draftIdCache.get(pubId);

	if (cached) {
		return cached;
	}

	const pub = await Pub.findOne({
		where: { id: pubId },
		include: [{ model: Draft, as: 'draft' }],
		attributes: ['id'],
	});

	const draftId = pub?.draft?.id ?? null;

	if (draftId) {
		draftIdCache.set(pubId, draftId);
	}

	return draftId;
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
			await getCollabAuthority().receiveCommit(draftId, req.body);
		} catch (e) {
			if (e instanceof TooMuchContentionError) {
				console.log('TooMuchContentionError', e);
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

		const commits = await getCollabAuthority().listenForCommit(draftId, version);
		return res.status(200).json(commits);
	}),
);

// get steps between two versions (non-blocking, for discussion fast-forwarding)
router.get(
	'/api/pubs/:pubId/commits/steps',
	wrap(async (req, res) => {
		const draftId = await getDraftIdForPub(req.params.pubId);

		if (!draftId) {
			return res.status(404).json({ error: 'Pub or draft not found' });
		}

		const from = parseInt(req.query.from as string, 10);
		const to = parseInt(req.query.to as string, 10);

		if (Number.isNaN(from) || Number.isNaN(to)) {
			return res.status(400).json({ error: 'Missing or invalid from/to' });
		}

		const commits = await CollabCommit.findAll({
			where: {
				draftId,
				version: { [Op.gt]: from, [Op.lte]: to },
			},
			order: [['version', 'ASC']],
		});

		return res
			.status(200)
			.json(commits.map((c: any) => ({ version: c.version, steps: c.steps })));
	}),
);

// update presence indicator
router.post(
	'/api/pubs/:pubId/presence/:clientId',
	wrap(async (req, res) => {
		const indicator = req.body as PresenceIndicator;
		await (await getPresenceAuthority()).updatePresence(req.params.pubId, indicator);

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

		const presence = await (await getPresenceAuthority()).listenForPresence(
			req.params.pubId,
			clientId,
			refs,
		);

		return res.status(200).json(presence);
	}),
);
