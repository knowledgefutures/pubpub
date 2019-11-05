// eslint-disable-next-line import/no-unresolved
const { parentPort, isMainThread, workerData } = require('worker_threads');

const {
	deletePageSearchData,
	setPageSearchData,
	deletePubSearchData,
	setPubSearchData,
	updateCommunityData,
	updateUserData,
} = require('./tasks/search');
const { importTask } = require('./tasks/import-export/import');
const { exportTask } = require('./tasks/export');

if (isMainThread) {
	// Don't run outside of a thread spawned by worker_threads in queue.js
	process.exit(1);
}

const main = async (taskData) => {
	let taskPromise;
	if (taskData.type === 'export') {
		taskPromise = exportTask(
			taskData.input.pubId,
			taskData.input.branchId,
			taskData.input.format,
		);
	} else if (taskData.type === 'import') {
		taskPromise = importTask(taskData.input);
	} else if (taskData.type === 'deletePageSearchData') {
		taskPromise = deletePageSearchData(taskData.input);
	} else if (taskData.type === 'setPageSearchData') {
		taskPromise = setPageSearchData(taskData.input);
	} else if (taskData.type === 'deletePubSearchData') {
		taskPromise = deletePubSearchData(taskData.input);
	} else if (taskData.type === 'setPubSearchData') {
		taskPromise = setPubSearchData(taskData.input);
	} else if (taskData.type === 'updateCommunityData') {
		taskPromise = updateCommunityData(taskData.input);
	} else if (taskData.type === 'updateUserData') {
		taskPromise = updateUserData(taskData.input);
	} else {
		throw new Error('Invalid task type');
	}
	let taskResult;
	try {
		taskResult = await taskPromise;
		parentPort.postMessage({ result: taskResult });
		process.exit(0);
	} catch (error) {
		parentPort.postMessage({ error: error });
		process.exit(1);
	}
};

main(workerData);
