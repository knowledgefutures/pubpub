import firebaseAdmin from 'firebase-admin';
import { buildSchema, getFirebaseDoc } from '@pubpub/editor';
import discussionSchema from 'components/DiscussionAddon/discussionSchema';
import { getFirebaseConfig } from 'utilities';
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

export const getBranchDoc = (pubId, branchId, versionNumber) => {
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
	return getFirebaseDoc(firebaseRef, editorSchema, versionNumber);
};

export const getFirebaseToken = (clientId, clientData) => {
	return firebaseAdmin.auth().createCustomToken(clientId, clientData);
};
