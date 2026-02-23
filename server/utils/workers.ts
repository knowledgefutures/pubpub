import amqplib from 'amqplib';

import { createWorkerTask } from 'server/workerTask/queries';
import { TaskPriority, taskQueueName } from 'utils/workers';

let openChannelPromise: Promise<amqplib.ConfirmChannel> | null = null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const isRetryableAmqpError = (err: any) => {
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

async function withRetry(
	fn: (attempt: number) => Promise<any>,
	{ deadlineMs = 30_000, baseDelayMs = 250, maxDelayMs = 2_000 } = {},
) {
	const start = Date.now();
	let attempt = 0;
	let lastErr: any;
	while (Date.now() - start < deadlineMs) {
		attempt += 1;
		try {
			// biome-ignore lint/performance/noAwaitInLoops: intentional retry loop
			return await fn(attempt);
		} catch (err: any) {
			lastErr = err;
			if (!isRetryableAmqpError(err)) throw err;
			const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** Math.min(attempt - 1, 6));
			const jitter = Math.floor(Math.random() * 150);
			const delay = exp + jitter;
			console.warn(
				`RabbitMQ not ready (attempt ${attempt}). Retrying in ${delay}ms...`,
				err?.code || err?.message,
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

const invalidateChannel = () => {
	openChannelPromise = null;
};

const createChannel = async (): Promise<amqplib.ConfirmChannel> => {
	const amqpUrl = process.env.CLOUDAMQP_URL;
	if (!amqpUrl) throw new Error('CLOUDAMQP_URL environment variable not set');

	return withRetry(async () => {
		const connection = await amqplib.connect(amqpUrl, {
			heartbeat: 60,
		});

		connection.on('error', (err) => {
			console.error('RabbitMQ connection error:', err);
			invalidateChannel();
		});
		connection.on('close', () => {
			console.warn('RabbitMQ connection closed, will reconnect on next publish');
			invalidateChannel();
		});

		const channel = await connection.createConfirmChannel();

		await channel.assertQueue(taskQueueName, {
			durable: true,
			maxPriority: TaskPriority.Highest,
		});

		channel.on('error', (err) => {
			console.error('RabbitMQ channel error:', err);
			invalidateChannel();
			try {
				connection.close();
			} catch {}
		});
		channel.on('close', () => {
			invalidateChannel();
			try {
				connection.close();
			} catch {}
		});

		return channel;
	});
};

const getDefaultTaskPriority = () => {
	const processPriority = process.env.DEFAULT_QUEUE_TASK_PRIORITY;
	if (processPriority) {
		return parseInt(processPriority, 10);
	}
	return TaskPriority.Normal;
};

const getOrCreateOpenChannel = async (): Promise<amqplib.ConfirmChannel> => {
	if (process.env.NODE_ENV === 'test') {
		return {
			sendToQueue: () => {},
			waitForConfirms: () => {},
		} as any;
	}
	if (!openChannelPromise) {
		openChannelPromise = createChannel();
	}
	return openChannelPromise;
};

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
	input: any;
	priority?: number;
}) => {
	const workerTask = await createWorkerTask({ type, input, priority });
	const message = Buffer.from(JSON.stringify({ id: workerTask.id, type, input }));
	await sendMessageToOpenChannel(message, priority);
	return workerTask;
};
