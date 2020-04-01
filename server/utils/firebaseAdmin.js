import firebaseAdmin from 'firebase-admin';

import {
	buildSchema,
	getFirebaseDoc,
	getLatestKeyAndTimestamp,
	getFirstKeyAndTimestamp,
	createBranch,
	mergeBranch,
	restoreDiscussionMaps,
} from '@pubpub/editor';

// These relative import statements are useful for letting us use this file in node scripts.
import discussionSchema from '../../shared/editor/discussionSchema';
import { getFirebaseConfig } from '../../shared/editor/firebaseConfig';

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

export const getBranchRef = (pubId, branchId) => {
	return database.ref(`pub-${pubId}/branch-${branchId}`);
};

const maybeAddKeyTimestampPair = (key, timestamp) => {
	if (typeof key === 'number' && key >= 0) {
		return { [key]: timestamp };
	}
	return null;
};

export const getBranchDoc = async (pubId, branchId, historyKey, updateOutdatedCheckpoint) => {
	const branchRef = getBranchRef(pubId, branchId);

	const [
		{ doc, key: currentKey, timestamp: currentTimestamp, checkpointMap },
		{ timestamp: firstTimestamp, key: firstKey },
		{ timestamp: latestTimestamp, key: latestKey },
	] = await Promise.all([
		getFirebaseDoc(branchRef, editorSchema, historyKey, updateOutdatedCheckpoint),
		getFirstKeyAndTimestamp(branchRef),
		getLatestKeyAndTimestamp(branchRef),
	]);

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

export const getFirebaseToken = (clientId, clientData) => {
	return firebaseAdmin.auth(firebaseApp).createCustomToken(clientId, clientData);
};

export const createFirebaseBranch = (pubId, baseBranchId, newBranchId) => {
	const baseFirebaseRef = getBranchRef(pubId, baseBranchId);
	const newFirebaseRef = getBranchRef(pubId, newBranchId);
	return createBranch(baseFirebaseRef, newFirebaseRef);
};

export const mergeFirebaseBranch = (pubId, sourceBranchId, destinationBranchId) => {
	const sourceFirebaseRef = getBranchRef(pubId, sourceBranchId);
	const destinationFirebaseRef = getBranchRef(pubId, destinationBranchId);
	return mergeBranch(sourceFirebaseRef, destinationFirebaseRef).then(async (res) => {
		await restoreDiscussionMaps(destinationFirebaseRef, editorSchema, true);
		return res;
	});
};

export const updateFirebaseDiscussion = async (discussion) => {
	const { branchId, pubId, id: discussionId } = discussion;
	const branchKey = `pub-${pubId}/branch-${branchId}`;
	const discussionsRef = database.ref(`${branchKey}/discussionsContentLive`);
	const existingDiscussion = await discussionsRef
		.orderByChild('id')
		.equalTo(discussionId)
		.once('value');
	if (existingDiscussion.exists()) {
		const childKey = Object.keys(existingDiscussion.val())[0];
		return existingDiscussion.ref.child(childKey).update(discussion);
	}
	return discussionsRef.push(discussion);
};
