import amqplib from 'amqplib';

import { TaskPriority, taskQueueName } from 'utils/workers';
import { createWorkerTask } from 'server/workerTask/queries';

let openChannelPromise;

const createChannel = async () => {
	const connection = await amqplib.connect(process.env.CLOUDAMQP_URL);
	const channel = await connection.createConfirmChannel();
	await channel.assertQueue(taskQueueName, { durable: true, maxPriority: TaskPriority.Highest });
	return channel;
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

export const sendMessageToOpenChannel = async (message, priority) => {
	const openChannel = await getOrCreateOpenChannel();
	openChannel.sendToQueue(taskQueueName, message, {
		deliveryMode: true,
		priority: priority,
	});
	await openChannel.waitForConfirms();
};

export const addWorkerTask = async ({ type, input, priority = getDefaultTaskPriority() }) => {
	const workerTask = await createWorkerTask({ type: type, input: input, priority: priority });
	const message = Buffer.from(JSON.stringify({ id: workerTask.id, type: type, input: input }));
	await sendMessageToOpenChannel(message, priority);
	return workerTask;
};
