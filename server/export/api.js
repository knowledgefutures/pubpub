import app from '../server';
import { createExport } from './queries';

app.post('/api/export', (req, res) => {
	return createExport(req.body)
		.then((taskData) => {
			return res.status(200).json(taskData.id);
		})
		.catch((err) => {
			console.error('Error in postExport: ', err);
			return res.status(500).json(err.message);
		});
});
