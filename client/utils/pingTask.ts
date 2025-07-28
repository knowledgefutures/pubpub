/**
 * Given the ID of a worker task, pings the server until the task is done and resolves a promise, or
 * rejects if there was a problem with the task.
 */
import { apiFetch } from 'client/utils/apiFetch';

const pingTaskOnce = (taskId: string, baseUrl = '') =>
	apiFetch(`${baseUrl}/api/workerTasks?workerTaskId=${taskId}`);

export const pingTask = (
	taskId: string,
	interval: number,
	startInterval = interval,
	baseUrl?: string,
	/**
	 * Callback to call when the task is processing. Can be used to provide feedback to the user if
	 * the task is configured for that
	 */
	progressCallback?: (taskData: any) => void,
) => {
	return new Promise((resolve, reject) => {
		const checkTask = () => {
			pingTaskOnce(taskId, baseUrl)
				.then((taskData) => {
					if (taskData.isProcessing) {
						if (progressCallback) {
							progressCallback(taskData);
						}
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
};
