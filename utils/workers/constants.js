export const TaskPriority = {
	Highest: 20,
	High: 15,
	Normal: 10,
	Low: 5,
	Lowest: 0,
};

// Update this value when you make changes to the queue structure that require the creation of
// a new queue. Once this code is in production and running on both the web and worker dynos,
// a queue with this name will be created automatically. You'll need to visit the RabbitMQ
// control panel, move all unfinished tasks into the new queue, and then delete the old one.
export const taskQueueName = 'pubpubTaskQueue-2020-07-20';
