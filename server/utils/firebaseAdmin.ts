import firebase from 'firebase';
import firebaseAdmin from 'firebase-admin';

import {
	buildSchema,
	getFirebaseDoc,
	getLatestKeyAndTimestamp,
	getFirstKeyAndTimestamp,
	createBranch,
	mergeBranch,
} from 'components/Editor';
import discussionSchema from 'utils/editor/discussionSchema';
import { getFirebaseConfig } from 'utils/editor/firebaseConfig';
import { storeCheckpoint } from 'client/components/Editor/utils';
import { restoreDiscussionMaps } from 'server/utils/discussionMaps';

const getFirebaseApp = () => {
	if (firebaseAdmin.apps.length > 0) {
		return firebaseAdmin.apps[0];
	}
	if (process.env.NODE_ENV === 'test') {
		if (process.env.FIREBASE_TEST_DB_URL) {
			return firebaseAdmin.initializeApp({ databaseURL: process.env.FIREBASE_TEST_DB_URL });
		}
		return null;
	}
	const serviceAccount = JSON.parse(
		Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 as string, 'base64').toString(),
	);
	// eslint-disable-next-line no-console
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

export const getDatabaseRef = (key: string): firebase.database.Reference => {
	return (database?.ref(key) as unknown) as firebase.database.Reference;
};

export const getPubRef = (pubId: string) => {
	return getDatabaseRef(`pub-${pubId}`);
};

export const getBranchRef = (pubId: string, branchId: string) => {
	return getDatabaseRef(`pub-${pubId}/branch-${branchId}`);
};

const maybeAddKeyTimestampPair = (key, timestamp) => {
	if (typeof key === 'number' && key >= 0) {
		return { [key]: timestamp };
	}
	return null;
};

export const getBranchDoc = async (
	pubId,
	branchId,
	historyKey,
	createMissingCheckpoints,
	doRestoreDiscussionMaps,
) => {
	const branchRef = getBranchRef(pubId, branchId)!;

	const [
		{ doc, docIsFromCheckpoint, key: currentKey, timestamp: currentTimestamp, checkpointMap },
		{ timestamp: firstTimestamp, key: firstKey },
		{ timestamp: latestTimestamp, key: latestKey },
	] = await Promise.all(
		[
			getFirebaseDoc(branchRef, editorSchema, historyKey),
			getFirstKeyAndTimestamp(branchRef),
			getLatestKeyAndTimestamp(branchRef),
			doRestoreDiscussionMaps &&
				restoreDiscussionMaps(branchRef, editorSchema, true).catch(() => {}),
		].filter((x) => x),
	);

	if (!docIsFromCheckpoint && createMissingCheckpoints && currentKey === latestKey) {
		storeCheckpoint(branchRef, doc, latestKey);
	}

	return {
		doc: doc.toJSON(),
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
	const { key } = await getLatestKeyAndTimestamp(branchRef!);
	return key;
};

export const getFirebaseToken = (clientId, clientData) => {
	// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'App | null' is not assignable to... Remove this comment to see the full error message
	return firebaseAdmin.auth(firebaseApp).createCustomToken(clientId, clientData);
};

export const createFirebaseBranch = (pubId, baseBranchId, newBranchId) => {
	const baseFirebaseRef = getBranchRef(pubId, baseBranchId);
	const newFirebaseRef = getBranchRef(pubId, newBranchId);
	// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
	return createBranch(baseFirebaseRef, newFirebaseRef);
};

export const mergeFirebaseBranch = (pubId, sourceBranchId, destinationBranchId) => {
	const sourceFirebaseRef = getBranchRef(pubId, sourceBranchId);
	const destinationFirebaseRef = getBranchRef(pubId, destinationBranchId);
	return mergeBranch(sourceFirebaseRef, destinationFirebaseRef, editorSchema).then(
		async (mergeResult) => {
			if (mergeResult) {
				await restoreDiscussionMaps(destinationFirebaseRef, editorSchema, true);
			}
			return mergeResult;
		},
	);
};
