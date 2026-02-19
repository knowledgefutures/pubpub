import type { TaskType } from './worker';

import * as Sentry from '@sentry/node';
import amqplib from 'amqplib';
import path from 'path';
import { Worker } from 'worker_threads';

import { WorkerTask } from 'server/models';
import { expect } from 'utils/assert';
import { createCachePurgeDebouncer } from 'utils/caching/createCachePurgeDebouncer';
import { getAppCommit, isProd } from 'utils/environment';
import { TaskPriority, taskQueueName } from 'utils/workers';

const maxWorkerTimeSeconds = 120;
const maxWorkerThreads = 5;
let currentWorkerThreads = 0;

/** Nice to be able to run certain tasks longer than the default timeout */
const customTimeouts = {
	archive: 14_400, // 4 hours
} satisfies Partial<Record<TaskType, number>>;

if (process.env.NODE_ENV === 'production') {
	Sentry.init({
		dsn: 'https://abe1c84bbb3045bd982f9fea7407efaa@sentry.io/1505439',
		environment: isProd() ? 'prod' : 'dev',
		release: getAppCommit(),
		tracesSampleRate: 1,
		integrations: [new Sentry.Integrations.Postgres()],
	});
}

const { schedulePurge: schedulePurgeWorker } = createCachePurgeDebouncer({
	errorHandler: process.env.NODE_ENV === 'production' ? Sentry.captureException : undefined,
	debounceTime: 5000,
	throttleTime: 1000,
});

// Every worker task should be run exactly once, but we keep an attemptCount field in the database
// to account for cases where a task is interrupted, never acked, and then resent from the queue.
// This could happen if a task causes the worker dyno to crash, for instance.
const incrementAttemptCount = async (taskId, maxAttemptCount = 2) => {
	const workerTaskData = expect(
		await WorkerTask.findOne({ where: { id: taskId }, useMaster: true }),
	);
	if (workerTaskData.attemptCount && workerTaskData.attemptCount >= maxAttemptCount) {
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

		// Export tasks return a URL and a hostname as output, we want to purge the cache of the hostname
		const { output, ...rest } = updatedTaskData;

		const { hostname, ...restOutput } = output || {};

		await WorkerTask.update(
			{ ...rest, output: hostname ? restOutput : output },
			{
				where: { id: taskData.id },
			},
		);

		if (hostname) {
			schedulePurgeWorker(hostname);
		}

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

	const maxWorkerTime = customTimeouts[taskData.type] ?? maxWorkerTimeSeconds;

	taskTimeout = setTimeout(() => {
		// Ask the worker nicely to kill its subprocesses
		worker.postMessage('yield');
		setTimeout(() => {
			// Well, you had your chance
			worker.terminate();
			onWorkerError(`Worker terminated after ${maxWorkerTime} seconds`);
		}, 1000);
	}, maxWorkerTime * 1000);
};

const cloudAmqpUrl = process.env.CLOUDAMQP_URL;
if (!cloudAmqpUrl) {
	throw new Error('CLOUDAMQP_URL environment variable not set');
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const isRetryableAmqpError = (err: any) => {
	const msg = String(err?.message || '');
	const code = err?.code;
	return (
		code === 'ECONNREFUSED' ||
		code === 'ENOTFOUND' ||
		code === 'EAI_AGAIN' ||
		code === 'ETIMEDOUT' ||
		msg.includes('ECONNREFUSED') ||
		msg.includes('getaddrinfo') ||
		msg.includes('Socket closed') ||
		msg.includes('Handshake terminated') ||
		msg.includes('Connection closing')
	);
};

async function connectAndConsumeWithRetry({
	cloudAmqpUrl,
	deadlineMs = 30_000,
}: {
	cloudAmqpUrl: string;
	deadlineMs?: number;
}) {
	const start = Date.now();
	let attempt = 0;
	let lastErr: any;

	let conn: amqplib.Connection | null = null;

	// Register SIGINT handler once
	process.once('SIGINT', () => {
		try {
			conn?.close();
		} catch {}
		process.exit(0);
	});

	while (Date.now() - start < deadlineMs) {
		attempt += 1;
		try {
			// biome-ignore lint/performance/noAwaitInLoops: we need to
			conn = await amqplib.connect(cloudAmqpUrl);

			conn.on('error', (err) => {
				console.error('RabbitMQ connection error:', err);
			});
			conn.on('close', () => {
				console.error('RabbitMQ connection closed');
			});

			const ch = await conn.createConfirmChannel();

			await ch.assertQueue(taskQueueName, {
				durable: true,
				maxPriority: TaskPriority.Highest,
			});

			ch.prefetch(maxWorkerThreads);

			await ch.consume(taskQueueName, processTask(ch), { noAck: false });

			console.log(
				` ==> Sequelize Max Connections: ${
					process.env.WORKER
						? 2
						: process.env.SEQUELIZE_MAX_CONNECTIONS
							? parseInt(process.env.SEQUELIZE_MAX_CONNECTIONS, 10)
							: 5
				}`,
			);
			console.log(` [*] Waiting for messages on ${taskQueueName}. To exit press CTRL+C`);

			return; // success; leave the retry loop
		} catch (err: any) {
			lastErr = err;
			if (!isRetryableAmqpError(err)) throw err;

			const base = Math.min(2000, 250 * 2 ** Math.min(attempt - 1, 6));
			const jitter = Math.floor(Math.random() * 150);
			const delay = base + jitter;

			console.warn(
				`RabbitMQ not ready (attempt ${attempt}); retrying in ${delay}ms...`,
				err?.code || err?.message,
			);

			// best-effort cleanup
			try {
				await conn?.close();
			} catch {}
			conn = null;

			await sleep(delay);
		}
	}

	throw new Error(
		`Failed to connect/consume within ${deadlineMs}ms. Last error: ${
			lastErr?.message || lastErr
		}`,
	);
}

connectAndConsumeWithRetry({ cloudAmqpUrl }).catch((e) => {
	console.error(e);
	process.exit(1);
});
