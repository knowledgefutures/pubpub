import { WorkerTask } from '../models';
import { addWorkerTask } from '../utils';

export const createImport = async ({ sourceFiles, importerFlags }) => {
	const input = { sourceFiles: sourceFiles, importerFlags: importerFlags };
	const workerTask = await WorkerTask.create({
		isProcessing: true,
		type: 'import',
		input: input,
	});
	await addWorkerTask(
		JSON.stringify({
			id: workerTask.id,
			type: workerTask.type,
			input: input,
		}),
	);
	return workerTask;
};
