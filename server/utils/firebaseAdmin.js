import firebaseAdmin from 'firebase-admin';
import { buildSchema, getFirebaseDoc, restoreDiscussionMaps } from '@pubpub/editor';
import discussionSchema from 'containers/Pub/PubDocument/DiscussionAddon/discussionSchema';
import { getFirebaseConfig } from 'utils';
/* To encode: Buffer.from(JSON.stringify(serviceAccountJson)).toString('base64'); */
const serviceAccount = JSON.parse(
	Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString(),
);

const firebaseApp = firebaseAdmin.initializeApp(
	{
		credential: firebaseAdmin.credential.cert(serviceAccount),
		databaseURL: getFirebaseConfig().databaseURL,
	},
	'firebase-pub-new',
);
const database = firebaseApp.database();

export const getBranchDoc = (pubId, branchId, historyKey) => {
	const pubKey = `pub-${pubId}`;
	const branchKey = `branch-${branchId}`;
	// const branchKey = '';

	const firebaseRef = database.ref(`${pubKey}/${branchKey}`);

	/* TODO: Document expected structure of content at firebaseRef. For example: */
	/*
		pubKey/branchKey 
			changes: []
			selections: []
	*/
	const editorSchema = buildSchema({ ...discussionSchema }, {});

	return getFirebaseDoc(firebaseRef, editorSchema, historyKey);
	// return restoreDiscussionMaps(firebaseRef, editorSchema, true).then(() => {
	// 	console.log('Finished with restoreDiscussionMaps');
	// 	return getFirebaseDoc(firebaseRef, editorSchema, versionNumber);
	// });
};

export const getFirebaseToken = (clientId, clientData) => {
	return firebaseAdmin.auth(firebaseApp).createCustomToken(clientId, clientData);
};
