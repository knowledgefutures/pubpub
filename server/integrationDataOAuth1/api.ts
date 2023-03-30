import app, { wrap } from 'server/server';

import { destroyIntegrationDataOAuth1 } from './queries';

app.delete(
	'/api/integrationDataOAuth1',
	wrap((req, res) =>
		destroyIntegrationDataOAuth1(req.body.id, req.user.id).then(() =>
			res.status(201).json(req.body.id),
		),
	),
);
