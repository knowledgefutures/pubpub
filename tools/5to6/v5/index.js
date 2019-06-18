/* eslint-disable no-restricted-syntax */
require('ignore-styles');

const { storage } = require('../setup');
const { queryPubUpdatedTimes } = require('./queryPub');
const processPub = require('./processPub');
const getPipedPubIds = require('../util/getPipedPubIds');

const blacklist = [
	'0f21f44a-dc5e-4e8d-83b8-d1194e38d755', // Frankenbook
	// '8f7503e4-6e51-4e13-8204-708ad04067ec', // Resisting Reduction
];

const main = async () => {
	const pipedPubIds = await getPipedPubIds();
	const pubUpdatedAtTimes = await queryPubUpdatedTimes();
	const bustCache = process.argv.find((a) => a.startsWith('--bust-cache'));
	pipedPubIds
		.filter((pubId) => !blacklist.includes(pubId))
		.reduce(
			(promise, pubId, index, arr) =>
				promise.then(() =>
					processPub(
						storage,
						pubId,
						pubUpdatedAtTimes,
						{
							current: index + 1,
							total: arr.length,
						},
						bustCache,
					),
				),
			Promise.resolve(),
		);
};

main();
