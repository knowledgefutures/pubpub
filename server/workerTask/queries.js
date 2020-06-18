import { WorkerTask } from 'server/models';

export const getWorkerTask = (inputValues) => {
	return WorkerTask.findOne({
		where: {
			id: inputValues.workerTaskId,
		},
		attributes: ['id', 'isProcessing', 'error', 'output'],
	});
};
