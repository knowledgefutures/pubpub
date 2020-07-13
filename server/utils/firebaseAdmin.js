import firebaseAdmin from 'firebase-admin';

import {
	buildSchema,
	getFirebaseDoc,
	getLatestKeyAndTimestamp,
	getFirstKeyAndTimestamp,
	createBranch,
	mergeBranch,
	restoreDiscussionMaps,
} from 'components/Editor';
import discussionSchema from 'utils/editor/discussionSchema';
import { getFirebaseConfig } from 'utils/editor/firebaseConfig';
import { copyDiscussionMapsToBranch } from '../../client/components/Editor/utils/discussions';
import { storeCheckpoint } from '../../client/components/Editor/utils';

const getFirebaseApp = () => {
	if (firebaseAdmin.apps.length > 0) {
		return firebaseAdmin.apps[0];
	}
	if (process.env.NODE_ENV === 'test') {
		if (process.env.FIREBASE_TEST_DB_URL) {
			return firebaseAdmin.initializeApp({ databaseUrl: process.env.FIREBASE_TEST_DB_URL });
		}
		// TODO(ian): Make sure we always get something here
		return null;
	}
	/* To encode: Buffer.from(JSON.stringify(serviceAccountJson)).toString('base64'); */
	const serviceAccount = JSON.parse(
		Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString(),
	);
	/* eslint-disable-next-line no-console */
	console.log(`Firebase App will use: ${getFirebaseConfig().databaseURL}`);
	return firebaseAdmin.initializeApp(
		{
			credential: firebaseAdmin.credential.cert(serviceAccount),
			databaseURL: getFirebaseConfig().databaseURL,
		},
		'firebase-pub-new',
	);
};

const firebaseApp = getFirebaseApp();
const database = firebaseApp && firebaseApp.database();
export const editorSchema = buildSchema({ ...discussionSchema }, {});

export const getPubRef = (pubId) => {
	return database.ref(`pub-${pubId}`);
};

export const getBranchRef = (pubId, branchId) => {
	return database.ref(`pub-${pubId}/branch-${branchId}`);
};

const maybeAddKeyTimestampPair = (key, timestamp) => {
	if (typeof key === 'number' && key >= 0) {
		return { [key]: timestamp };
	}
	return null;
};

export const getBranchDoc = async (pubId, branchId, historyKey, createMissingCheckpoints) => {
	const branchRef = getBranchRef(pubId, branchId);

	const [
		{ doc, docIsFromCheckpoint, key: currentKey, timestamp: currentTimestamp, checkpointMap },
		{ timestamp: firstTimestamp, key: firstKey },
		{ timestamp: latestTimestamp, key: latestKey },
	] = await Promise.all([
		getFirebaseDoc(branchRef, editorSchema, historyKey),
		getFirstKeyAndTimestamp(branchRef),
		getLatestKeyAndTimestamp(branchRef),
	]);

	if (!docIsFromCheckpoint && createMissingCheckpoints && currentKey === latestKey) {
		storeCheckpoint(branchRef, doc, latestKey);
	}

	return {
		doc: doc,
		mostRecentRemoteKey: currentKey,
		firstTimestamp: firstTimestamp,
		latestTimestamp: latestTimestamp,
		historyData: {
			timestamps: {
				...checkpointMap,
				...maybeAddKeyTimestampPair(firstKey, firstTimestamp),
				...maybeAddKeyTimestampPair(currentKey, currentTimestamp),
				...maybeAddKeyTimestampPair(latestKey, latestTimestamp),
			},
			currentKey: currentKey,
			latestKey: latestKey,
		},
	};
};

export const getLatestKey = async (pubId, branchId) => {
	const branchRef = getBranchRef(pubId, branchId);
	const { key } = await getLatestKeyAndTimestamp(branchRef);
	return key;
};

export const getFirebaseToken = (clientId, clientData) => {
	return firebaseAdmin.auth(firebaseApp).createCustomToken(clientId, clientData);
};

export const createFirebaseBranch = (pubId, baseBranchId, newBranchId) => {
	const baseFirebaseRef = getBranchRef(pubId, baseBranchId);
	const newFirebaseRef = getBranchRef(pubId, newBranchId);
	return createBranch(baseFirebaseRef, newFirebaseRef);
};

export const mergeFirebaseBranch = (
	pubId,
	sourceBranchId,
	destinationBranchId,
	copyDiscussionMaps = false,
) => {
	const sourceFirebaseRef = getBranchRef(pubId, sourceBranchId);
	const destinationFirebaseRef = getBranchRef(pubId, destinationBranchId);
	return mergeBranch(sourceFirebaseRef, destinationFirebaseRef, editorSchema).then(
		async (mergeResult) => {
			const { mergeKey } = mergeResult;
			await restoreDiscussionMaps(destinationFirebaseRef, editorSchema, true);
			if (copyDiscussionMaps) {
				await copyDiscussionMapsToBranch(
					sourceFirebaseRef,
					destinationFirebaseRef,
					mergeKey,
				);
			}
			return mergeResult;
		},
	);
};
