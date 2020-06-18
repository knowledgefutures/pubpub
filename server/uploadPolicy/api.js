import app from 'server/server';

import { getUploadPolicy } from './queries';

app.get('/api/uploadPolicy', (req, res) => {
	return getUploadPolicy(req.query)
		.then((uploadPolicy) => {
			return res.status(200).json(uploadPolicy);
		})
		.catch((err) => {
			console.error('Error in getUploadPolicy: ', err);
			return res.status(500).json(err.message);
		});
});
