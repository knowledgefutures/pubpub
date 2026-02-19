import amqplib from 'amqplib';

import { createWorkerTask } from 'server/workerTask/queries';
import { TaskPriority, taskQueueName } from 'utils/workers';

let openChannelPromise;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const isRetryableAmqpError = (err) => {
	// Connection refused / DNS not ready / broker not up yet
	const msg = String(err?.message || '');
	const code = err?.code;
	return (
		code === 'ECONNREFUSED' ||
		code === 'ENOTFOUND' ||
		code === 'EAI_AGAIN' ||
		code === 'ETIMEDOUT' ||
		msg.includes('connect ECONNREFUSED') ||
		msg.includes('getaddrinfo') ||
		msg.includes('Socket closed') ||
		msg.includes('Handshake terminated') ||
		msg.includes('Connection closing')
	);
};

async function withRetry(fn, { deadlineMs = 30_000, baseDelayMs = 250, maxDelayMs = 2_000 } = {}) {
	const start = Date.now();
	let attempt = 0;
	let lastErr;

	while (Date.now() - start < deadlineMs) {
		attempt += 1;
		try {
			// biome-ignore lint/performance/noAwaitInLoops: we need to
			return await fn(attempt);
		} catch (err) {
			lastErr = err;
			if (!isRetryableAmqpError(err)) throw err;

			// simple exponential backoff with jitter
			const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** Math.min(attempt - 1, 6));
			const jitter = Math.floor(Math.random() * 150);
			const delay = exp + jitter;

			console.warn(
				`RabbitMQ not ready (attempt ${attempt}). Retrying in ${delay}ms...`,
				(err as any)?.code || (err as any)?.message,
			);
			await sleep(delay);
		}
	}

	throw new Error(
		`Failed to connect to RabbitMQ within ${deadlineMs}ms. Last error: ${
			lastErr?.message || lastErr
		}`,
	);
}

const createChannel = async () => {
	const amqpUrl = process.env.CLOUDAMQP_URL;
	if (!amqpUrl) throw new Error('CLOUDAMQP_URL environment variable not set');

	return withRetry(
		async () => {
			const connection = await amqplib.connect(amqpUrl);

			// Optional: handle connection-level issues too
			connection.on('error', (err) => {
				console.error('RabbitMQ connection error:', err);
			});
			connection.on('close', () => {
				console.error('RabbitMQ connection closed');
				openChannelPromise = null;
			});

			const channel = await connection.createConfirmChannel();
			await channel.assertQueue(taskQueueName, {
				durable: true,
				maxPriority: TaskPriority.Highest,
			});

			channel.on('close', (err) => {
				console.error('Worker channel closed:', err);
				openChannelPromise = null;
				try {
					connection.close();
				} catch {}
			});

			return channel;
		},
		{ deadlineMs: 30_000 },
	);
};

const getDefaultTaskPriority = () => {
	const processPriorty = process.env.DEFAULT_QUEUE_TASK_PRIORITY;
	if (processPriorty) {
		return parseInt(processPriorty, 10);
	}
	return TaskPriority.Normal;
};

const getOrCreateOpenChannel = async () => {
	if (process.env.NODE_ENV === 'test') {
		return {
			sendToQueue: () => {},
			waitForConfirms: () => {},
		};
	}
	if (!openChannelPromise) {
		openChannelPromise = createChannel();
	}
	return openChannelPromise;
};

getOrCreateOpenChannel();

export const sendMessageToOpenChannel = async (message: Buffer, priority: number) => {
	const openChannel = await getOrCreateOpenChannel();
	openChannel.sendToQueue(taskQueueName, message, {
		deliveryMode: true,
		priority,
	});
	await openChannel.waitForConfirms();
};

export const addWorkerTask = async ({
	type,
	input,
	priority = getDefaultTaskPriority(),
}: {
	type: 'import' | 'export' | 'archive';
	input;
	priority?: number;
}) => {
	const workerTask = await createWorkerTask({ type, input, priority });
	const message = Buffer.from(JSON.stringify({ id: workerTask.id, type, input }));
	await sendMessageToOpenChannel(message, priority);
	return workerTask;
};
