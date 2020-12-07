import app, { wrap } from 'server/server';

import { getUploadPolicy } from './queries';

app.get(
	'/api/uploadPolicy',
	wrap((req, res) => {
		const uploadPolicy = getUploadPolicy(req.query);
		return res.status(200).json(uploadPolicy);
	}),
);
