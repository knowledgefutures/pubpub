/* eslint-disable no-console */
const Promise = require('bluebird');
const firebaseAdmin = require('firebase-admin');
const { buildSchema, restoreDiscussionMaps } = require('components/Editor');
const discussionSchema = require('./simpleDiscussionSchema').default;
const getPipedPubIds = require('../util/getPipedPubIds');
require('../../../server/config.js');

const serviceAccount = JSON.parse(
	Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString(),
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

const main = async () => {
	const pipedBranchObjects = await getPipedPubIds();
	console.time('Map Time');
	pipedBranchObjects.reduce(
		(promise, branchObject, index, arr) =>
			promise
				.then(async () => {
					const branchJSON = JSON.parse(branchObject);
					console.log(
						`~~~~~~~~ Processing ${branchJSON.pubId}/${branchJSON.branchId} (${index +
							1}/${arr.length}) ~~~~~~~~`,
					);
					const branchRef = database.ref(
						`pub-${branchJSON.pubId}/branch-${branchJSON.branchId}`,
					);
					const editorSchema = buildSchema({ ...discussionSchema }, {});
					try {
						await restoreDiscussionMaps(branchRef, editorSchema, true);
						console.log(`OK: ${branchJSON.pubId}/${branchJSON.branchId}`);
					} catch (error) {
						console.log(`FAILURE: ${branchJSON.pubId}/${branchJSON.branchId}`);
						console.log(error);
					}
				})
				.then(() => {
					if (index === arr.length - 1) {
						console.timeEnd('Map Time');
					}
				}),
		Promise.resolve(),
	);
};

main();
