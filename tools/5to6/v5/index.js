/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
require('ignore-styles');

const Promise = require('bluebird');
const { storage } = require('../setup');
const { queryPubUpdatedTimes } = require('./queryPub');
const processPub = require('./processPub');
const getPipedPubIds = require('../util/getPipedPubIds');

const blacklist = [
	'0f21f44a-dc5e-4e8d-83b8-d1194e38d755', // Frankenbook
	// '8f7503e4-6e51-4e13-8204-708ad04067ec', // Resisting Reduction
	'c7212765-f563-4659-83a3-df8ef826663d', // Enlightened - go in and manually set this after migration
];

const main = async () => {
	console.time('Transform Time');
	const pipedPubIds = await getPipedPubIds();
	const pubUpdatedAtTimes = await queryPubUpdatedTimes();
	const bustCache = process.argv.find((a) => a.startsWith('--bust-cache'));
	pipedPubIds
		.filter((pubId) => !blacklist.includes(pubId))
		.reduce(
			(promise, pubId, index, arr) =>
				promise
					.then(() => {
						return processPub(
							storage,
							pubId,
							pubUpdatedAtTimes,
							{
								current: index + 1,
								total: arr.length,
							},
							bustCache,
						);
					})
					.then(() => {
						if (index === arr.length - 1) {
							console.timeEnd('Transform Time');
						}
					}),
			Promise.resolve(),
		);
	// const filteredIds = pipedPubIds.filter((pubId) => !blacklist.includes(pubId));
	// Promise.map(
	// 	filteredIds,
	// 	(pubId, index, length) => {
	// 		return processPub(
	// 			storage,
	// 			pubId,
	// 			pubUpdatedAtTimes,
	// 			{
	// 				current: index + 1,
	// 				total: length,
	// 			},
	// 			bustCache,
	// 		)
	// 			.then(() => {
	// 				if (index === length - 1) {
	// 					console.timeEnd('Transform Time');
	// 				}
	// 			})
	// 			.catch((err) => {
	// 				console.error('Promise Map Error', err);
	// 			});
	// 	},
	// 	{ concurrency: 25 },
	// );
};

main();
