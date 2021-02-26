/**
 * Given the ID of a worker task, pings the server until the task is done and resolves a promise,
 * or rejects if there was a problem with the task.
 */
import { apiFetch } from 'client/utils/apiFetch';

const pingTaskOnce = (taskId) => apiFetch(`/api/workerTasks?workerTaskId=${taskId}`);

export const pingTask = (taskId, interval, startInterval = interval) =>
	new Promise((resolve, reject) => {
		const checkTask = () => {
			pingTaskOnce(taskId)
				.then((taskData) => {
					if (taskData.isProcessing) {
						setTimeout(checkTask, interval);
					} else if (taskData.error) {
						reject(new Error(taskData.error));
					} else {
						resolve(taskData.output);
					}
				})
				.catch((err) => reject(err));
		};
		setTimeout(checkTask, startInterval);
	});
