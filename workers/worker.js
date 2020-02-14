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
const { exportTask } = require('./tasks/export');
const { importTask } = require('./tasks/import');

if (isMainThread) {
	// Don't run outside of a thread spawned by worker_threads in queue.js
	process.exit(1);
}

const taskMap = {
	export: exportTask,
	import: importTask,
	deletePageSearchData: deletePageSearchData,
	setPageSearchData: setPageSearchData,
	deletePubSearchData: deletePubSearchData,
	setPubSearchData: setPubSearchData,
	updateCommunityData: updateCommunityData,
	updateUserData: updateUserData,
};

const main = async (taskData) => {
	const { type, input } = taskData;
	const subprocesses = [];
	const taskFn = taskMap[type];

	if (typeof taskFn !== 'function') {
		throw new Error(`No task function available for task type ${type}`);
	}

	parentPort.on('message', (message) => {
		if (message === 'yield') {
			subprocesses.forEach((ps) => ps.kill());
		}
	});

	const collectSubprocess = (ps) => subprocesses.push(ps);
	const taskPromise = taskFn(input, collectSubprocess);

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
