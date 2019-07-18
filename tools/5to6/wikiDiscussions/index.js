/* eslint-disable no-console */
const Promise = require('bluebird');
const firebaseAdmin = require('firebase-admin');
const { buildSchema, restoreDiscussionMaps } = require('@pubpub/editor');
const { Pub, Branch, BranchPermission, Discussion } = require('../../../server/models');
const discussionSchema = require('./simpleDiscussionSchema').default;
require('../../../server/config.js');

const serviceAccount = JSON.parse(
	Buffer.from(process.env.V6_FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString(),
);

const firebaseApp =
	firebaseAdmin.apps.length > 0
		? firebaseAdmin.apps[0]
		: firebaseAdmin.initializeApp(
				{
					credential: firebaseAdmin.credential.cert(serviceAccount),
					databaseURL: process.env.V6_FIREBASE_URL,
				},
				'firebase-pub-new',
		  );
const database = firebaseApp.database();
const editorSchema = buildSchema({ ...discussionSchema }, {});

Pub.findAll({
	where: {
		communityId: '59b78ccd-9bf0-43ab-9855-8cd37706e691',
		// id: '2586840f-ca60-430e-bf10-c6787efaee9c',
	},
	include: [
		{
			required: false,
			separate: true,
			model: Discussion,
			as: 'discussions',
		},
		{
			// separate: true,
			model: Branch,
			as: 'branches',
			required: true,
		},
	],
})
	.then((pubData) => {
		const processEach = pubData.map((pub) => {
			const draftBranch = pub.branches.find((branch) => branch.title === 'draft');
			const draftBranchRef = database.ref(`pub-${pub.id}/branch-${draftBranch.id}`);

			/* Process and write new data */
			// console.log(`~~~ Processing ${pub.id} ~~~`);
			// const updatePostgresDiscussions = Discussion.update(
			// 	{ branchId: draftBranch.id },
			// 	{
			// 		where: { pubId: pub.id },
			// 	},
			// );

			// const getFirebaseDiscussions = pub.branches.map((branch) => {
			// 	return database
			// 		.ref(`pub-${pub.id}/branch-${branch.id}`)
			// 		.child('discussions')
			// 		.once('value')
			// 		.then((snapshot) => {
			// 			return snapshot.val();
			// 		});
			// });
			// const copyFirebaseDiscussions = Promise.all(getFirebaseDiscussions).then(
			// 	(firebaseDiscussions) => {
			// 		const aggregateDiscussions = {};

			// 		firebaseDiscussions
			// 			.filter((branchDiscussions) => {
			// 				return !!branchDiscussions;
			// 			})
			// 			.forEach((branchDiscussions) => {
			// 				Object.keys(branchDiscussions).forEach((discussionKey) => {
			// 					const prevData = aggregateDiscussions[discussionKey] || {};
			// 					const currData = branchDiscussions[discussionKey];
			// 					aggregateDiscussions[discussionKey] = {
			// 						...prevData,
			// 						...currData,
			// 					};
			// 				});
			// 			});
			// 		return draftBranchRef.child('discussions').set(aggregateDiscussions);
			// 	},
			// );
			// return Promise.all([updatePostgresDiscussions, copyFirebaseDiscussions]).then(() => {
			// 	console.log(`~~~ Finished ${pub.id} ~~~`);
			// });

			/* Restore discussion anchors */
			return restoreDiscussionMaps(draftBranchRef, editorSchema, true).then(() => {
				console.log(`~~~ Finished ${pub.id} ~~~`);
			});

			/* Delete unneeded content */

			// const branchToDelete = pub.branches.find((branch) => {
			// 	return branch.title !== 'draft' && branch.title !== 'public';
			// });
			// if (branchToDelete) {
			// 	console.log('----:', pub.id);
			// 	console.log(
			// 		branchToDelete && branchToDelete.title,
			// 		branchToDelete && branchToDelete.id,
			// 	);
			// 	// Branch.destory({
			// 	// 	where: { id: branchToDelete.id}
			// 	// });
			// 	// const deletedBranchRef = database.ref(`pub-${pub.id}/branch-${branchToDelete.id}`);
			// 	console.log(`pub-${pub.id}/branch-${branchToDelete.id}`);
			// }
		});
		return Promise.all(processEach);
	})
	.catch((err) => {
		console.error(err);
	})
	.finally(() => {
		console.log('Ending wiki migration');
		process.exit();
	});

// const main = async () => {
// 	const pipedBranchObjects = await getPipedPubIds();
// 	console.time('Map Time');
// 	pipedBranchObjects.reduce(
// 		(promise, branchObject, index, arr) =>
// 			promise
// 				.then(async () => {
// 					const branchJSON = JSON.parse(branchObject);
// 					console.log(
// 						`~~~~~~~~ Processing ${branchJSON.pubId}/${branchJSON.branchId} (${index +
// 							1}/${arr.length}) ~~~~~~~~`,
// 					);
// 					const branchRef = database.ref(
// 						`pub-${branchJSON.pubId}/branch-${branchJSON.branchId}`,
// 					);
// 					const editorSchema = buildSchema({ ...discussionSchema }, {});
// 					try {
// 						await restoreDiscussionMaps(branchRef, editorSchema, true);
// 						console.log(`OK: ${branchJSON.pubId}/${branchJSON.branchId}`);
// 					} catch (error) {
// 						console.log(`FAILURE: ${branchJSON.pubId}/${branchJSON.branchId}`);
// 						console.log(error);
// 					}
// 				})
// 				.then(() => {
// 					if (index === arr.length - 1) {
// 						console.timeEnd('Map Time');
// 					}
// 				}),
// 		Promise.resolve(),
// 	);
// };

// main();
