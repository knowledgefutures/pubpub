/* eslint-disable no-console */
import Promise from 'bluebird';
// import { Op } from 'sequelize';
import { Pub, PubManager, User } from '../../server/models';

const createFirebaseClient = require('../5to6/util/createFirebaseClient');

const sourceFirebaseUrl = 'https://pubpub-v6-dev.firebaseio.com';
// const destFirebaseUrl = 'https://pubpub-v6-dev.firebaseio.com';
const hasCitations = [];
const citationPrior = {};
const pubLookup = {};
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
	attributes: ['id', 'slug'],
	include: [
		{
			model: PubManager,
			as: 'managers',
			// eslint-disable-next-line pubpub-rules/no-user-model
			include: [{ model: User, as: 'user', attributes: ['fullName', 'email'] }],
		},
	],
	// limit: 200,
})
	.then((allPubs) => {
		const pubIds = allPubs.map((pub) => pub.id);
		allPubs.forEach((pub) => {
			pubLookup[pub.id] = pub;
		});
		const createSourceClient = createFirebaseClient(
			sourceFirebaseUrl,
			process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
		);
		// const createDestClient = createFirebaseClient(
		// 	destFirebaseUrl,
		// 	process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
		// );
		return Promise.all([pubIds, createSourceClient]);
	})
	.then(([pubIds, sourceClient]) => {
		const sourceReader = sourceClient.reader;
		// const destWriter = destClient.writer;
		let completed = 0;
		return Promise.map(
			pubIds,
			(pubId, index, arrayLength) => {
				return sourceReader(pubId)
					.then((data) => {
						// return destWriter(pubId, JSON.parse(data));
						if (data === 'null') {
							return null;
						}
						const jsonData = JSON.parse(data);
						Object.values(jsonData).forEach((branch) => {
							if (branch.checkpoint) {
								const content = branch.checkpoint.d.c;
								content.forEach((item, contentIndex, array) => {
									if (item.t === 'citationList') {
										hasCitations.push(pubId);
										citationPrior[pubId] = [
											array[contentIndex - 2],
											array[contentIndex - 1],
										];
									}
								});
							}
						});
						return null;
					})
					.then(() => {
						completed += 1;
						if (completed % 100 === 0) {
							console.log(
								`Completed ${completed} of ${arrayLength}. ${
									[...new Set(hasCitations)].length
								} have citations.`,
							);
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
		// console.log(hasCitations);
		Object.keys(citationPrior).forEach((key) => {
			console.log(key);
			console.log(pubLookup[key].slug);
			pubLookup[key].managers.forEach((manager) => {
				console.log(manager.user.fullName, manager.user.email);
			});
			// console.log(JSON.stringify(citationPrior[key], null, 2));
			console.log('===========================');
		});
		console.log(`Completed. ${[...new Set(hasCitations)].length} have citations.`);
		console.log('Finishing Citation migration');
		process.exit();
	});
