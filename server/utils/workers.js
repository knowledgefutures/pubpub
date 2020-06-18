import amqplib from 'amqplib';

/* Worker Queue Tasks */
const queueName = 'pubpubTaskQueue';
let openChannel;

const setOpenChannel = () => {
	amqplib.connect(process.env.CLOUDAMQP_URL).then((conn) => {
		return conn.createConfirmChannel().then((channel) => {
			return channel.assertQueue(queueName, { durable: true }).then(() => {
				openChannel = channel;
			});
		});
	});
};

if (process.env.NODE_ENV !== 'test') {
	setOpenChannel();
}

export const addWorkerTask = (message) => {
	if (process.env.NODE_ENV === 'test') {
		return null;
	}
	if (!openChannel) {
		setOpenChannel();
	}
	openChannel.sendToQueue(queueName, Buffer.from(message), { deliveryMode: true });
	return openChannel.waitForConfirms();
};
