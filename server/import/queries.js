import AWS from 'aws-sdk';
import { WorkerTask } from '../models';
import { addWorkerTask } from '../utils';

AWS.config.setPromisesDependency(Promise);
const s3bucket = new AWS.S3({ params: { Bucket: 'assets.pubpub.org' } });

export const createImport = (inputValues) => {
	const input = {
		sourceUrl: inputValues.sourceUrl,
	};

	return new Promise((resolve, reject) => {
		/* This block is set because the worker event */
		/* was reaching the queue before the uploaded S3 file */
		/* was available. Give it a bit of a delay to avoid */
		/* that race condition if we see that the file isn't */
		/* ready yet. */
		let attempts = 0;
		const checkForFile = () => {
			s3bucket
				.headObject({
					Key: inputValues.sourceUrl.replace('https://assets.pubpub.org/', ''),
				})
				.promise()
				.then(resolve)
				.catch(() => {
					if (attempts > 5) {
						return reject();
					}
					attempts += 1;
					return setTimeout(() => {
						checkForFile();
					}, 1000);
				});
		};
		checkForFile();
	})
		.then(() => {
			return WorkerTask.create({
				isProcessing: true,
				type: 'import',
				input: input,
			});
		})
		.then((workerTaskData) => {
			const sendMessage = addWorkerTask(
				JSON.stringify({
					id: workerTaskData.id,
					type: workerTaskData.type,
					input: input,
				}),
			);
			return Promise.all([workerTaskData, sendMessage]);
		})
		.then(([workerTaskData]) => {
			return workerTaskData;
		});
};
