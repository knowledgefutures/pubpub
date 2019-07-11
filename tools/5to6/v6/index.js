/* eslint-disable no-console */
const Promise = require('bluebird');
const { storage } = require('../setup');
const getPipedPubIds = require('../util/getPipedPubIds');

const processPub = require('./processPub');
const createFirebaseClient = require('../util/createFirebaseClient');

const main = async () => {
	let updatedPubsCount = 0;
	const pipedPubIds = await getPipedPubIds();
	const { writer: writeToFirebase } = await createFirebaseClient(
		process.env.V6_FIREBASE_URL,
		process.env.V6_FIREBASE_SERVICE_ACCOUNT_BASE64,
	);
	console.time('Upload Time');
	pipedPubIds.reduce(
		(promise, pubId, index, arr) =>
			promise
				.then(async () => {
					const wasUpdated = await processPub(storage, pubId, writeToFirebase, {
						current: index + 1,
						total: arr.length,
					});
					if (wasUpdated) {
						updatedPubsCount += 1;
					}
				})
				.then(() => {
					if (index === arr.length - 1) {
						console.timeEnd('Upload Time');
						console.log('Uploaded pubs count:', updatedPubsCount);
					}
				}),
		Promise.resolve(),
	);
};

main();
