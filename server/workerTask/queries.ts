import { WorkerTask } from 'server/models';

export const getWorkerTask = ({ workerTaskId }) => {
	return WorkerTask.findOne({
		where: {
			id: workerTaskId,
		},
		attributes: ['id', 'isProcessing', 'error', 'output'],
	});
};

export const createWorkerTask = ({ type, input, priority }) =>
	WorkerTask.create({ isProcessing: true, type, input, priority });
