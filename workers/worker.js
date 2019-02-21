/* eslint-disable global-require */
/* eslint-disable no-console */
import amqplib from 'amqplib';
import exportTask from './exportTask';
import importTask from './importTask';
import {
	deletePageSearchData,
	setPageSearchData,
	deletePubSearchData,
	setPubSearchData,
	updateCommunityData,
	updateUserData,
} from './searchTasks';
import { WorkerTask } from '../server/models';

if (process.env.NODE_ENV !== 'production') {
	require('../server/config.js');
}

const processTask = (channel) => {
	return (msg) => {
		const taskData = JSON.parse(msg.content.toString());
		console.log('Beginning task ', taskData.id);

		/* Set the variable for updatedWorkerTaskData */
		/* We will update this data depending on whether */
		/* the task succeeds or fails, and have a single */
		/* request to update the database WorkerTask row. */
		let updatedWorkerTaskData;

		return WorkerTask.findOne({
			where: { id: taskData.id },
		})
			.then((workerTaskData) => {
				/* Sometimes tasks fail in ways that do not trigger the */
				/* catch and finally functions of this Promise chain. */
				/* My hunch is memory quotas are exceeded, or other */
				/* pandoc runtime errors cause it to hang/fail. */
				/* In these cases, let's try it a couple times, and */
				/* if it winds up back in the queue after those attempts, */
				/* finish and ack the task. */
				if (workerTaskData.attemptCount >= 2) {
					throw new Error('Too many attempts');
				}
				/* If we are below the allowed attemptCount, increment */
				/* attemptCount in the database and continue. */
				const newAttemptCount = workerTaskData.attemptCount
					? workerTaskData.attemptCount + 1
					: 1;
				return WorkerTask.update(
					{ attemptCount: newAttemptCount },
					{
						where: { id: taskData.id },
					},
				);
			})
			.then(() => {
				/* Specify which task function to run based on the type as set in the msg */
				let taskFunction;
				if (taskData.type === 'export') {
					taskFunction = exportTask(
						taskData.input.pubId,
						taskData.input.versionId,
						taskData.input.content,
						taskData.input.format,
					);
				} else if (taskData.type === 'import') {
					taskFunction = importTask(taskData.input.sourceUrl);
				} else if (taskData.type === 'deletePageSearchData') {
					taskFunction = deletePageSearchData(taskData.input);
				} else if (taskData.type === 'setPageSearchData') {
					taskFunction = setPageSearchData(taskData.input);
				} else if (taskData.type === 'deletePubSearchData') {
					taskFunction = deletePubSearchData(taskData.input);
				} else if (taskData.type === 'setPubSearchData') {
					taskFunction = setPubSearchData(taskData.input);
				} else if (taskData.type === 'updateCommunityData') {
					taskFunction = updateCommunityData(taskData.input);
				} else if (taskData.type === 'updateUserData') {
					taskFunction = updateUserData(taskData.input);
				} else {
					taskFunction = new Promise((resolve, reject) => {
						reject(new Error('Invalid Task Type'));
					});
				}

				/* Run the task as determined by the msg type */
				return taskFunction;
			})
			.then((taskOutput) => {
				/* On success, set the taskOutput to output */
				updatedWorkerTaskData = {
					isProcessing: false,
					error: null,
					output: taskOutput,
				};
			})
			.catch((taskErr) => {
				/* On failure, set the taskError to error */
				updatedWorkerTaskData = {
					isProcessing: false,
					error: taskErr.message ? taskErr.message : taskErr,
					output: null,
				};
				console.error(taskErr);
			})
			.finally(() => {
				/* On either success or failure, update */
				/* the WorkTask database row with the  */
				/* result of the function and ack the queue msg */
				return WorkerTask.update(updatedWorkerTaskData, {
					where: { id: taskData.id },
				}).then(() => {
					console.log('Finished task ', taskData.id);
					channel.ack(msg);
				});
			});
	};
};

/* Initialize the connection to the queue and set */
/* the processTask function to run on new msgs */
amqplib
	.connect(process.env.CLOUDAMQP_URL)
	.then((conn) => {
		process.once('SIGINT', () => {
			conn.close();
		});
		return conn.createConfirmChannel().then((ch) => {
			let ok = ch.assertQueue('pubpubTaskQueue', { durable: true });
			ok = ok.then(() => {
				ch.prefetch(1);
			});
			ok = ok.then(() => {
				ch.consume('pubpubTaskQueue', processTask(ch), { noAck: false });
				console.log(' [*] Waiting for messages. To exit press CTRL+C');
			});
			return ok;
		});
	})
	.catch(console.warn);

// importTask('https://assets.pubpub.org/_testing/01540904698402.html')
// .then((result)=> {
// 	console.log(result.html);
// })
// .catch((err)=> {
// 	console.error(err);
// });

// taskFunction = importTask('https://assets.pubpub.org/ywh5c35b/61529509039692.docx');

// exportTask('3ecac2f5-8065-4bde-aa0e-c1ab222fd673', '427a3c55-993a-4083-918c-85c682bedccf', null, 'pdf')
// .then((output)=> {
// 	console.log('got output', output);
// })
// .catch((err)=> {
// 	console.log('Caught err', err.message);
// });
