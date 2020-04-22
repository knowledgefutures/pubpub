/* eslint-disable */
const Promise = require('bluebird');
const firebaseAdmin = require('firebase-admin');
const { buildSchema, restoreDiscussionMaps } = require('components/Editor');
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
		// id: 'ad872a9a-95cf-4ac0-84a8-63b60e0727cb',
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
			const publicBranch = pub.branches.find((branch) => branch.title === 'public');
			const draftBranchRef = database.ref(`pub-${pub.id}/branch-${draftBranch.id}`);
			const publicBranchRef = database.ref(`pub-${pub.id}/branch-${publicBranch.id}`);

			/* v4 code -------------- */
			// const getPublicMerges = publicBranchRef
			// 	.child('merges')
			// 	.once('value')
			// 	.then((snapshot) => {
			// 		return snapshot.val();
			// 	});

			// return getPublicMerges
			// 	.then((mergesData) => {
			// 		const mergesArray = mergesData || [];
			// 		const newKeys = mergesArray.reduce((prev, curr) => {
			// 			if (prev) {
			// 				return [...prev, prev[prev.length - 1] + curr.length];
			// 			}
			// 			return [curr.length];
			// 		}, undefined);

			// 		const getDiscussions = draftBranchRef
			// 			.child('discussions')
			// 			.once('value')
			// 			.then((snapshot) => {
			// 				return snapshot.val();
			// 			});
			// 		return Promise.all([newKeys, getDiscussions]);
			// 	})
			// 	.then(([newKeys = [], discussionsData]) => {
			// 		// console.log(discussionsData);
			// 		const newDiscussionsData = {};
			// 		Object.keys(discussionsData || {}).forEach((dataKey) => {
			// 			const data = discussionsData[dataKey];
			// 			// console.log(newKeys);
			// 			if (newKeys.includes(data.initKey)) {
			// 				const newData = {
			// 					initKey: data.initKey - 1,
			// 					currentKey: data.initKey - 1,
			// 					initAnchor: data.initAnchor || null,
			// 					initHead: data.initHead || null,
			// 					selection: {
			// 						t: 'text',
			// 						a: data.initAnchor || null,
			// 						h: data.initHead || null,
			// 					}
			// 				};
			// 				newDiscussionsData[dataKey] = newData;
			// 			} else {
			// 				newDiscussionsData[dataKey] = data;	
			// 			}
			// 		});
			// 		// console.log(newDiscussionsData);
			// 		return draftBranchRef.child('discussions').set(newDiscussionsData);
			// 	})
			// 	.then(() => {
			// 		return restoreDiscussionMaps(draftBranchRef, editorSchema, true).then(() => {
			// 			console.log(`~~~ Finished ${pub.id} ~~~`);
			// 		})
			// 	});

			/* v3 code -------------- */
			// const getMaxDraftKey = draftBranchRef
			// 	.child('checkpoint')
			// 	.child('k')
			// 	.once('value')
			// 	.then((snapshot) => {
			// 		return snapshot.val();
			// 	});

			// return getMaxDraftKey
			// 	.then((maxDraftKey) => {
					

			// 		const getDiscussions = draftBranchRef
			// 			.child('discussions')
			// 			.once('value')
			// 			.then((snapshot) => {
			// 				return snapshot.val();
			// 			});
			// 		return Promise.all([Number(maxDraftKey), getDiscussions]);
			// 	})
			// 	.then(([maxDraftKey, discussionsData]) => {
			// 		// console.log(discussionsData);
			// 		const newDiscussionsData = {};
			// 		Object.keys(discussionsData || {}).forEach((dataKey) => {
			// 			const data = discussionsData[dataKey];
			// 			if (Number(data.initKey) > maxDraftKey) {
			// 				const newData = {
			// 					initKey: maxDraftKey,
			// 					currentKey: maxDraftKey,
			// 					initAnchor: data.initAnchor || null,
			// 					initHead: data.initHead || null,
			// 					selection: {
			// 						t: 'text',
			// 						a: data.initAnchor || null,
			// 						h: data.initHead || null,
			// 					}
			// 				};
			// 				newDiscussionsData[dataKey] = newData;
			// 			} else {
			// 				newDiscussionsData[dataKey] = data;	
			// 			}
			// 		});
			// 		return draftBranchRef.child('discussions').set(newDiscussionsData);
			// 	});


			/* v2 code -------------- */
			// const getPublicMerges = publicBranchRef
			// 	.child('merges')
			// 	.once('value')
			// 	.then((snapshot) => {
			// 		return snapshot.val();
			// 	});

			// return getPublicMerges
			// 	.then((mergesData) => {
			// 		const mergesArray = mergesData || [];
			// 		const newKeys = mergesArray.reduce((prev, curr) => {
			// 			if (prev) {
			// 				return [...prev, prev[prev.length - 1] + curr.length];
			// 			}
			// 			return [curr.length];
			// 		}, undefined);

			// 		const getDiscussions = draftBranchRef
			// 			.child('discussions')
			// 			.once('value')
			// 			.then((snapshot) => {
			// 				return snapshot.val();
			// 			});
			// 		return Promise.all([newKeys, getDiscussions]);
			// 	})
			// 	.then(([newKeys = [], discussionsData]) => {
			// 		// console.log(discussionsData);
			// 		const newDiscussionsData = {};
			// 		Object.keys(discussionsData || {}).forEach((dataKey) => {
			// 			const data = discussionsData[dataKey];
			// 			if (data.initKey < newKeys.length) {
			// 				const newData = {
			// 					initKey: newKeys[data.initKey],
			// 					currentKey: newKeys[data.initKey],
			// 					initAnchor: data.initAnchor || null,
			// 					initHead: data.initHead || null,
			// 					selection: {
			// 						t: 'text',
			// 						a: data.initAnchor || null,
			// 						h: data.initHead || null,
			// 					}
			// 				};
			// 				newDiscussionsData[dataKey] = newData;
			// 			} else {
			// 				newDiscussionsData[dataKey] = data;	
			// 			}
			// 		});
			// 		return draftBranchRef.child('discussions').set(newDiscussionsData);
			// 	})
			// 	.then(() => {
			// 		return restoreDiscussionMaps(draftBranchRef, editorSchema, true).then(() => {
			// 			console.log(`~~~ Finished ${pub.id} ~~~`);
			// 		})
			// 	});

			/* v1 code -------------- */
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
			// return restoreDiscussionMaps(draftBranchRef, editorSchema, true).then(() => {
			// 	console.log(`~~~ Finished ${pub.id} ~~~`);
			// });

			/* Delete unneeded content */
			// const branchToDelete = pub.branches.find((branch) => {
			// 	return branch.title !== 'draft' && branch.title !== 'public';
			// });
			// if (branchToDelete) {
			// 	console.log('----:', pub.id);
			// 	// console.log(
			// 	// 	branchToDelete && branchToDelete.title,
			// 	// 	branchToDelete && branchToDelete.id,
			// 	// );
			// 	const destroyPostgres = Branch.destroy({
			// 		where: { id: branchToDelete.id },
			// 	});
			// 	const deletedBranchRef = database
			// 		.ref(`pub-${pub.id}/branch-${branchToDelete.id}`)
			// 		.remove();
			// 	return Promise.all([destroyPostgres, deletedBranchRef]);
			// }
			// return null;
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
