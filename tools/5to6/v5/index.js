/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
const Promise = require('bluebird');
const { storage } = require('../setup');
// const { queryPubUpdatedTimes } = require('./queryPub');
const processPub = require('./processPub');
const getPipedPubIds = require('../util/getPipedPubIds');
const createFirebaseClient = require('../util/createFirebaseClient');

const skipIds = [
	'0f21f44a-dc5e-4e8d-83b8-d1194e38d755', // Frankenbook
	// '8f7503e4-6e51-4e13-8204-708ad04067ec', // Resisting Reduction
	'c7212765-f563-4659-83a3-df8ef826663d', // Enlightened - go in and manually set this after migration. Nested list limit
];

const main = async () => {
	console.time('Transform Time');
	const pipedPubIds = await getPipedPubIds();
	// const pubUpdatedAtTimes = await queryPubUpdatedTimes();
	const bustCache = process.argv.find((a) => a.startsWith('--bust-cache'));
	const { reader: readFromFirebase } = await createFirebaseClient(
		process.env.V5_FIREBASE_URL,
		process.env.V5_FIREBASE_SERVICE_ACCOUNT_BASE64,
	);
	let updatedPubsCount = 0;
	pipedPubIds
		.filter((pubId) => !skipIds.includes(pubId))
		.reduce(
			(promise, pubId, index, arr) =>
				promise
					.then(async () => {
						const wasUpdated = await processPub(
							storage,
							pubId,
							readFromFirebase,
							{
								current: index + 1,
								total: arr.length,
							},
							bustCache,
						);
						if (wasUpdated) {
							updatedPubsCount += 1;
						}
					})
					.then(() => {
						if (index === arr.length - 1) {
							console.log('Transformed pubs count:', updatedPubsCount);
							console.timeEnd('Transform Time');
						}
					}),
			Promise.resolve(),
		);
};

main();
