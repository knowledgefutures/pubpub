import app from '../server';
import { WorkerTask } from '../models';
import { addWorkerTask } from '../utilities';

app.post('/api/export', (req, res) => {
	const input = {
		pubId: req.body.pubId,
		versionId: req.body.versionId,
		content: req.body.content,
		format: req.body.format,
	};

	return WorkerTask.create({
		isProcessing: true,
		type: 'export',
		input: input,
	})
		.then((workerTaskData) => {
			const sendMessage = addWorkerTask(
				JSON.stringify({
					id: workerTaskData.id,
					type: workerTaskData.type,
					input: input,
				}),
			);
			return Promise.all([workerTaskData, sendMessage]);
		})
		.then(([workerTaskData]) => {
			return res.status(201).json(workerTaskData.id);
		})
		.catch((err) => {
			console.error('Error Adding Message', err);
			return res.status(500).json(err);
		});
});
