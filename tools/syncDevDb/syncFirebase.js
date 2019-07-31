/* eslint-disable no-console */
import Promise from 'bluebird';
// import { Op } from 'sequelize';
import { Pub } from './models';

const createFirebaseClient = require('../5to6/util/createFirebaseClient');

const sourceFirebaseUrl = 'https://pubpub-v6-prod.firebaseio.com';
const destFirebaseUrl = 'https://pubpub-v6-dev.firebaseio.com';

console.log('Starting Firebase sync');
Pub.findAll({
	// where: {
	// 	id: {
	// 		[Op.in]: [
	// 			'cb085b76-d8dc-4da6-9336-075a2303c6cf',
	// 			'278d35fb-1a99-458e-bae1-ee980ec0fc8f',
	// 			'20a01e90-7e49-4f66-9343-97f6d3065a92',
	// 			'28ed5513-39e4-4c8a-9b89-62f7e9c2264c',
	// 		],
	// 	},
	// },
	attributes: ['id'],
})
	.then((allPubs) => {
		const pubIds = allPubs.map((pub) => pub.id);
		const createSourceClient = createFirebaseClient(
			sourceFirebaseUrl,
			process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
		);
		const createDestClient = createFirebaseClient(
			destFirebaseUrl,
			process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
		);
		return Promise.all([pubIds, createSourceClient, createDestClient]);
	})
	.then(([pubIds, sourceClient, destClient]) => {
		const sourceReader = sourceClient.reader;
		const destWriter = destClient.writer;
		let completed = 0;
		return Promise.map(
			pubIds,
			(pubId, index, arrayLength) => {
				return sourceReader(pubId)
					.then((data) => {
						return destWriter(pubId, JSON.parse(data));
					})
					.then(() => {
						completed += 1;
						if (completed % 100 === 0) {
							console.log(`Completed ${completed} of ${arrayLength}`);
						}
					})
					.catch((err) => {
						console.log(`Failed on ${pubId}`);
						console.log(err);
					});
			},
			{ concurrency: 15 },
		);
	})
	.catch((err) => {
		console.log(err);
	})
	.finally(() => {
		console.log('Finishing Firebase Sync');
		process.exit();
	});
