import app from 'server/server';

import { getWorkerTask } from './queries';

app.get('/api/workerTasks', (req, res) => {
	return getWorkerTask(req.query as { workerTaskId: string })
		.then((workerTaskData) => {
			return res.status(201).json(workerTaskData);
		})
		.catch((err) => {
			console.error('Error getting WorkerTask', err);
			return res.status(500).json(err);
		});
});
