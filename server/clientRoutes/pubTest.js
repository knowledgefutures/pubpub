import React from 'react';
import Promise from 'bluebird';
import firebaseAdmin from 'firebase-admin';
import { Node } from 'prosemirror-model';
import { Step } from 'prosemirror-transform';
import { uncompressStateJSON, uncompressStepJSON } from 'prosemirror-compress-pubpub';
import { buildSchema } from '@pubpub/editor';
import PubTest from 'containers/PubTest/PubTest';
import discussionSchema from 'components/DiscussionAddon/discussionSchema';
import Html from '../Html';
import app from '../server';
// import { Version } from '../models';
import {
	hostIsValid,
	renderToNodeStream,
	getInitialData,
	handleErrors,
	generateMetaComponents,
} from '../utilities';

/* To encode: Buffer.from(JSON.stringify(serviceAccountJson)).toString('base64'); */
const serviceAccount = JSON.parse(
	Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString(),
);
const firebaseApp = firebaseAdmin.initializeApp(
	{
		credential: firebaseAdmin.credential.cert(serviceAccount),
		databaseURL: 'https://pubpub-v5-development.firebaseio.com',
	},
	'firebasetest',
);

app.get('/pub-test', (req, res, next) => {
	if (!hostIsValid(req, 'community')) {
		return next();
	}
	/* Get doc from Version */
	// const findContent = Version.findOne({ where: { id: 'bc368357-0ef5-400f-a2f6-39b0268499ab' } });

	/* Get doc from Checkpoint */
	// const editorKey = 'pub-bb62c347-1bca-483b-9cc0-44c5d845462c';
	// const database = firebaseApp.database();
	// const firebaseRef = database.ref(editorKey);
	// const findContent = firebaseRef
	// 	.child('checkpoint')
	// 	.once('value')
	// 	.then((checkpointSnapshot) => {
	// 		const checkpointSnapshotVal = checkpointSnapshot.val() || {
	// 			k: '0',
	// 			d: { type: 'doc', attrs: { meta: {} }, content: [{ type: 'paragraph' }] },
	// 		};

	// 		const content = uncompressStateJSON(checkpointSnapshotVal).doc;
	// 		return { content: content };
	// 	})
	// 	.catch((firebaseErr) => {
	// 		console.error('firebase-firebaseErr', firebaseErr);
	// 	});

	/* get doc from first steps */
	const editorKey = 'pub-bb62c347-1bca-483b-9cc0-44c5d845462c';
	const database = firebaseApp.database();
	const firebaseRef = database.ref(editorKey);
	const editorSchema = buildSchema({ ...discussionSchema }, {});
	let mostRecentRemoteKey;
	const changeArray = [];
	const findContent = firebaseRef
		.child('checkpoint')
		.once('value')
		.then(() => {
			const checkpointSnapshotVal = {
				k: '0',
				d: { type: 'doc', attrs: { meta: {} }, content: [{ type: 'paragraph' }] },
			};

			mostRecentRemoteKey = Number(checkpointSnapshotVal.k);
			const newDoc = Node.fromJSON(
				editorSchema,
				uncompressStateJSON({ d: checkpointSnapshotVal.d }).doc,
			);

			/* Get all changes since mostRecentRemoteKey */
			const getChanges = firebaseRef
				.child('changes')
				.orderByKey()
				.startAt(String(mostRecentRemoteKey + 1))
				// .endAt(String(mostRecentRemoteKey + 105))
				.once('value');

			return Promise.all([newDoc, getChanges]);
		})
		.then(([newDoc, changesSnapshot]) => {
			const changesSnapshotVal = changesSnapshot.val() || {};
			const steps = [];
			const stepClientIds = [];
			const keys = Object.keys(changesSnapshotVal);
			mostRecentRemoteKey = keys.length ? Math.max(...keys) : mostRecentRemoteKey;

			/* Uncompress steps and add stepClientIds */
			Object.keys(changesSnapshotVal).forEach((key) => {
				const compressedStepsJSON = changesSnapshotVal[key].s;
				const uncompressedSteps = compressedStepsJSON.map((compressedStepJSON) => {
					return Step.fromJSON(editorSchema, uncompressStepJSON(compressedStepJSON));
				});
				steps.push(...uncompressedSteps);
				stepClientIds.push(
					...new Array(compressedStepsJSON.length).fill(changesSnapshotVal[key].c),
				);
			});
			const updatedDoc = steps.reduce((prev, curr, index) => {
				const stepResult = curr.apply(prev);
				if (stepResult.failed) {
					console.error('Failed with ', stepResult.failed);
				}
				if (index % 10 === 0 || index === steps.length - 1) {
					changeArray.push({ index: index, doc: stepResult.doc.toJSON() });
				}
				return stepResult.doc;
			}, newDoc);
			return {
				content: updatedDoc.toJSON(),
				changeArray: changeArray,
				changesSnapshotVal: changesSnapshotVal,
			};
		})
		.catch((firebaseErr) => {
			console.error('firebase-firebaseErr', firebaseErr);
		});

	return Promise.all([getInitialData(req), findContent])
		.then(([initialData, versionData]) => {
			const pubData = {
				content: versionData.content,
				changeArray: versionData.changeArray,
				changesSnapshotVal: versionData.changesSnapshotVal,
			};
			const newInitialData = {
				...initialData,
				pubData: pubData,
			};
			return renderToNodeStream(
				res,
				<Html
					chunkName="PubTest"
					initialData={newInitialData}
					headerComponents={generateMetaComponents({
						initialData: initialData,
					})}
				>
					<PubTest {...newInitialData} />
				</Html>,
			);
		})
		.catch(handleErrors(req, res, next));
});
