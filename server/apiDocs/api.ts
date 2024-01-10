import app from 'server/server';
import { openApiMiddleware } from 'utils/api/openapi-router';

app.use(
	'/apidocs',
	openApiMiddleware({
		info: {
			title: 'PubPub API',
			version: '6.0.0',
		},
	}),
);
