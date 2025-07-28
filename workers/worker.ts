// eslint-disable-next-line import/no-unresolved
import { parentPort, isMainThread, workerData } from 'worker_threads';

import { Prettify } from 'types';
import {
	deletePageSearchData,
	setPageSearchData,
	deletePubSearchData,
	setPubSearchData,
	updateCommunityData,
	updateUserData,
} from './tasks/search';
import { exportTask } from './tasks/export';
import { importTask } from './tasks/import';
import { archiveTask } from './tasks/archive';

if (isMainThread) {
	// Don't run outside of a thread spawned by worker_threads in queue.js
	process.exit(1);
}

const taskMap = {
	export: exportTask,
	import: importTask,
	deletePageSearchData,
	setPageSearchData,
	deletePubSearchData,
	setPubSearchData,
	updateCommunityData,
	updateUserData,
	archive: archiveTask,
};

export type TaskType = keyof typeof taskMap;

export type TaskData<T extends TaskType> = {
	type: T;
	input: Parameters<(typeof taskMap)[T]>[0];
	id: string;
};

export type TaskResult<T extends TaskType> = Prettify<Awaited<ReturnType<(typeof taskMap)[T]>>>;

const main = async <T extends TaskType>(taskData: TaskData<T>) => {
	const { type, input, id } = taskData;
	const subprocesses = [];
	const taskFn = taskMap[type];

	if (typeof taskFn !== 'function') {
		throw new Error(`No task function available for task type ${type}`);
	}

	parentPort?.on('message', (message) => {
		if (message === 'yield') {
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'kill' does not exist on type 'never'.
			subprocesses.forEach((ps) => ps.kill());
		}
	});

	// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
	const collectSubprocess = (ps) => subprocesses.push(ps);

	// pass workerTaskId to archive task for progress tracking
	const taskPromise = taskFn(
		{ ...input, workerTaskId: id },
		// @ts-expect-error FIXME: Expected 1 arguments, but got 2.ts(2554). Does this even do anything?
		collectSubprocess,
	);

	let taskResult: TaskResult<T>;
	try {
		// @ts-expect-error FIXME: assignment error
		taskResult = await taskPromise;
		parentPort?.postMessage({ result: taskResult });
		process.exit(0);
	} catch (error) {
		parentPort?.postMessage({ error });
		process.exit(1);
	}
};

main(workerData);
