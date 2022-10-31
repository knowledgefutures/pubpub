/* eslint-disable no-console */
import path from 'path';
// eslint-disable-next-line import/no-unresolved
import { Worker } from 'worker_threads';
import amqplib from 'amqplib';
import * as Sentry from '@sentry/node';

import { isProd, getAppCommit } from 'utils/environment';
import { TaskPriority, taskQueueName } from 'utils/workers';
import { WorkerTask } from 'server/models';

const maxWorkerTimeSeconds = 120;
const maxWorkerThreads = 5;
let currentWorkerThreads = 0;

if (process.env.NODE_ENV === 'production') {
	Sentry.init({
		dsn: 'https://abe1c84bbb3045bd982f9fea7407efaa@sentry.io/1505439',
		environment: isProd() ? 'prod' : 'dev',
		release: getAppCommit(),
	});
}

// Every worker task should be run exactly once, but we keep an attemptCount field in the database
// to account for cases where a task is interrupted, never acked, and then resent from the queue.
// This could happen if a task causes the worker dyno to crash, for instance.
const incrementAttemptCount = async (taskId, maxAttemptCount = 2) => {
	const workerTaskData = await WorkerTask.findOne({ where: { id: taskId } });
	if (workerTaskData.attemptCount >= maxAttemptCount) {
		throw new Error('Too many attempts');
	}
	const newAttemptCount = workerTaskData.attemptCount ? workerTaskData.attemptCount + 1 : 1;
	await WorkerTask.update({ attemptCount: newAttemptCount }, { where: { id: taskId } });
};

const processTask = (channel) => async (message) => {
	currentWorkerThreads += 1;
	const taskData = JSON.parse(message.content.toString());
	let hasFinished = false;
	let taskTimeout;
	const startTime = Date.now();
	console.log(`Beginning ${taskData.id} (load ${currentWorkerThreads}/${maxWorkerThreads})`);

	const worker = new Worker(path.join(__dirname, 'initWorker.js'), {
		execArgv: ['-r', 'esm'],
		workerData: taskData,
	});

	const onWorkerFinished = async (updatedTaskData) => {
		if (hasFinished) {
			return;
		}
		clearTimeout(taskTimeout);
		hasFinished = true;
		currentWorkerThreads -= 1;
		const endTime = Date.now();
		const duration = (Math.round((endTime - startTime) / 100) / 10).toString();
		console.log(
			`Finished ${taskData.id} in ${duration} secs (load ${currentWorkerThreads}/${maxWorkerThreads})`,
		);
		await WorkerTask.update(updatedTaskData, {
			where: { id: taskData.id },
		});
		channel.ack(message);
	};

	const onWorkerError = async (error) => {
		console.error('In task:', error);
		if (process.env.NODE_ENV === 'production') {
			Sentry.captureException(error);
		}
		await onWorkerFinished({
			isProcessing: false,
			error: error.message ? error.message : error,
			output: null,
		});
	};

	const onWorkerMessage = async ({ result, error }) => {
		if (error) {
			await onWorkerError(error);
		} else {
			await onWorkerFinished({
				isProcessing: false,
				error: null,
				output: result,
			});
		}
	};

	try {
		await incrementAttemptCount(taskData.id);
	} catch (err) {
		await onWorkerError(err);
		return;
	}

	worker.on('error', onWorkerError);
	worker.on('message', onWorkerMessage);
	taskTimeout = setTimeout(() => {
		// Ask the worker nicely to kill its subprocesses
		worker.postMessage('yield');
		setTimeout(() => {
			// Well, you had your chance
			worker.terminate();
			onWorkerError(`Worker terminated after ${maxWorkerTimeSeconds} seconds`);
		}, 1000);
	}, maxWorkerTimeSeconds * 1000);
};

// Initialize the connection to the queue and set the processTask function to run on new messages
amqplib
	.connect(process.env.CLOUDAMQP_URL)
	.then((conn) => {
		process.once('SIGINT', () => {
			conn.close();
		});
		return conn.createConfirmChannel().then((ch) => {
			let ok = ch.assertQueue(taskQueueName, {
				durable: true,
				maxPriority: TaskPriority.Highest,
			});
			ok = ok.then(() => {
				ch.prefetch(maxWorkerThreads);
			});
			ok = ok.then(() => {
				ch.consume(taskQueueName, processTask(ch), { noAck: false });
				console.log(` [*] Waiting for messages on ${taskQueueName}. To exit press CTRL+C`);
			});
			return ok;
		});
	})
	.catch(console.warn);
