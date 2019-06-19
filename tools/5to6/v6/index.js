/* eslint-disable no-console */
const Promise = require('bluebird');
const { storage } = require('../setup');
const getPipedPubIds = require('../util/getPipedPubIds');

const processPub = require('./processPub');
const createFirebaseWriter = require('./createFirebaseWriter');

const main = async () => {
	const pipedPubIds = await getPipedPubIds();
	const writeToFirebase = await createFirebaseWriter();
	// Promise.map(
	// 	pipedPubIds,
	// 	(pubId, index, length) => {
	// 		return processPub(storage, pubId, writeToFirebase, {
	// 			current: index + 1,
	// 			total: length,
	// 		});
	// 	},
	// 	{ concurrency: 20 },
	// );

	console.time('Upload Time');
	pipedPubIds.reduce(
		(promise, pubId, index, arr) =>
			promise
				.then(() =>
					processPub(storage, pubId, writeToFirebase, {
						current: index + 1,
						total: arr.length,
					}),
				)
				.then(() => {
					if (index === arr.length - 1) {
						console.timeEnd('Upload Time');
					}
				}),
		Promise.resolve(),
	);
};

main();
