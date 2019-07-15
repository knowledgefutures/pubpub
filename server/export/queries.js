import { WorkerTask } from '../models';
import { addWorkerTask } from '../utils';

export const createExport = (inputValues) => {
	const input = {
		pubId: inputValues.pubId,
		branchId: inputValues.branchId,
		format: inputValues.format,
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
			return workerTaskData;
		});
};
