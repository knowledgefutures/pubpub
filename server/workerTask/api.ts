import { initServer } from '@ts-rest/express';
import { contract } from 'utils/api/contract';
import { importRouteImplementation } from 'server/import/api';
import { exportRouteImplementation } from 'server/export/api';
import { getWorkerTask } from './queries';

const s = initServer();

export const workerTaskServer = s.router(contract.workerTask, {
	get: async ({ query }) => {
		const workerTaskData = await getWorkerTask(query);
		if (workerTaskData === null) {
			return { status: 404, body: { error: 'WorkerTask not found' } };
		}
		return { status: 201, body: workerTaskData };
	},
	createImport: importRouteImplementation,
	createExport: exportRouteImplementation,
});
