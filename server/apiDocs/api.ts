import { Router } from 'express';

import { openApiMiddleware } from 'utils/api/openapi-router';

export const router = Router();

router.use(
	'/apidocs',
	openApiMiddleware({
		info: {
			title: 'PubPub API',
			version: '6.0.0',
		},
	}),
);
