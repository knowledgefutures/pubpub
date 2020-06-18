import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

import { getFirebaseConfig } from 'utils/editor/firebaseConfig';

export const initFirebase = async (rootKey, authToken) => {
	const firebaseAppName = `App-${rootKey}`;
	/* Check if we've already initialized an Firebase App with the */
	/* same name in this local environment */
	const existingApp = firebase.apps.reduce((prev, curr) => {
		return curr.name === firebaseAppName ? curr : prev;
	}, undefined);

	/* Use the existing Firebase App or initialize a new one */
	const firebaseApp = existingApp || firebase.initializeApp(getFirebaseConfig(), firebaseAppName);

	const database = firebase.database(firebaseApp);

	/* Authenticate with the server-generated token */
	try {
		const auth = await firebase.auth(firebaseApp);
		await auth.signOut();
		await auth.signInWithCustomToken(authToken);
		return [database.ref(`${rootKey}`), database.ref('.info/connected')];
	} catch (err) {
		console.error('Error authenticating firebase', err);
		return null;
	}
};
