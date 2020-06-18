import app from 'server/server';

import { createImport } from './queries';

app.post('/api/import', (req, res) => {
	return createImport(req.body)
		.then((taskData) => {
			return res.status(201).json(taskData.id);
		})
		.catch((err) => {
			console.error('Error in postImport: ', err);
			return res.status(500).json(err.message);
		});
});
