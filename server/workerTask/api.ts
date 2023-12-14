import { initServer } from '@ts-rest/express';
import { contract } from 'utils/api/contract';
import { ForbiddenError } from 'server/utils/errors';
import { getWorkerTask, updateWorkerTask } from './queries';

const s = initServer();

export const workerTaskServer = s.router(contract.workerTask, {
	get: async ({ query }) => {
		const workerTaskData = await getWorkerTask(query);
		if (workerTaskData === null) {
			return { status: 404, body: { error: 'WorkerTask not found' } };
		}
		return { status: 201, body: workerTaskData };
	},
	update: async ({ body, params, headers }) => {
		console.log(body);
		const secretKey = headers['x-worker-secret'];

		if (secretKey !== process.env.WORKER_SECRET_KEY) {
			throw new ForbiddenError(new Error('Invalid secret key'));
		}

		const result = await updateWorkerTask({ id: params.id, body });

		return { status: 200, body: result };
	},
});
