import { Router } from 'express';

import { ForbiddenError } from 'server/utils/errors';
import { wrap } from 'server/wrap';

import { getZoteroIntegration } from './queries';

export const router = Router();

router.get(
	'/api/zoteroIntegration',
	wrap((req, res) => {
		if (!req.user?.id) {
			throw new ForbiddenError(new Error('User is not logged in'));
		}

		return getZoteroIntegration(req.user.id).then((integration) =>
			integration
				? res.status(200).json({ id: integration.id })
				: res.status(404).json({ message: 'no zotero integration present for user' }),
		);
	}),
);
