import firebaseAdmin from 'firebase-admin';
import {
	buildSchema,
	getFirebaseDoc,
	createBranch,
	mergeBranch,
	// restoreDiscussionMaps,
} from '@pubpub/editor';
import discussionSchema from 'containers/Pub/PubDocument/DiscussionAddon/discussionSchema';
import { getFirebaseConfig } from 'utils';
/* To encode: Buffer.from(JSON.stringify(serviceAccountJson)).toString('base64'); */
const serviceAccount = JSON.parse(
	Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString(),
);

const firebaseApp =
	firebaseAdmin.apps.length > 0
		? firebaseAdmin.apps[0]
		: firebaseAdmin.initializeApp(
				{
					credential: firebaseAdmin.credential.cert(serviceAccount),
					databaseURL: getFirebaseConfig().databaseURL,
				},
				'firebase-pub-new',
		  );
const database = firebaseApp.database();

export const getBranchDoc = (pubId, branchId, historyKey, updateOutdatedCheckpoint) => {
	const pubKey = `pub-${pubId}`;
	const branchKey = `branch-${branchId}`;
	const firebaseRef = database.ref(`${pubKey}/${branchKey}`);
	const editorSchema = buildSchema({ ...discussionSchema }, {});
	return getFirebaseDoc(firebaseRef, editorSchema, historyKey, updateOutdatedCheckpoint);
	// return restoreDiscussionMaps(firebaseRef, editorSchema, true).then(() => {
	// 	console.log('Finished with restoreDiscussionMaps');
	// 	return getFirebaseDoc(firebaseRef, editorSchema, historyKey, true);
	// });
};

export const getFirebaseToken = (clientId, clientData) => {
	return firebaseAdmin.auth(firebaseApp).createCustomToken(clientId, clientData);
};

export const createFirebaseBranch = (pubId, baseBranchId, newBranchId) => {
	const pubKey = `pub-${pubId}`;
	const baseBranchKey = `branch-${baseBranchId}`;
	const newBranchKey = `branch-${newBranchId}`;

	const baseFirebaseRef = database.ref(`${pubKey}/${baseBranchKey}`);
	const newFirebaseRef = database.ref(`${pubKey}/${newBranchKey}`);
	return createBranch(baseFirebaseRef, newFirebaseRef);
};

export const mergeFirebaseBranch = (pubId, sourceBranchId, destinationBranchId) => {
	const pubKey = `pub-${pubId}`;
	const sourceBranchKey = `branch-${sourceBranchId}`;
	const destinationBranchKey = `branch-${destinationBranchId}`;

	const sourceFirebaseRef = database.ref(`${pubKey}/${sourceBranchKey}`);
	const destinationFirebaseRef = database.ref(`${pubKey}/${destinationBranchKey}`);
	return mergeBranch(sourceFirebaseRef, destinationFirebaseRef);
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
