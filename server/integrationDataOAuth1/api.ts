import { Router } from 'express';

import { wrap } from 'server/wrap';

import { destroyIntegrationDataOAuth1 } from './queries';

export const router = Router();

router.delete(
	'/api/integrationDataOAuth1',
	wrap((req, res) =>
		destroyIntegrationDataOAuth1(req.body.id, req.user.id).then(() =>
			res.status(201).json(req.body.id),
		),
	),
);
