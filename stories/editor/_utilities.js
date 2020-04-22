import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

export const editorWrapperStyle = {
	border: '1px solid #CCC',
	width: '700px',
	minHeight: '250px',
	cursor: 'text',
	padding: '20px',
	paddingRight: '200px',
};

// export const firebaseConfig = {
// 	apiKey: 'AIzaSyDGttY0gbzGUhrrUD9f9bllMxmYWl3WWoc',
// 	authDomain: 'pubpub-v4-dev.firebaseapp.com',
// 	databaseURL: 'https://pubpub-v4-dev.firebaseio.com',
// 	projectId: 'pubpub-v4-dev',
// 	storageBucket: 'pubpub-v4-dev.appspot.com',
// 	messagingSenderId: '175246944410'
// };

// export const firebaseConfig = {
// 	apiKey: 'AIzaSyBpE1sz_-JqtcIm2P4bw4aoMEzwGITfk0U',
// 	authDomain: 'pubpub-rich.firebaseapp.com',
// 	databaseURL: 'https://pubpub-rich.firebaseio.com',
// 	projectId: 'pubpub-rich',
// 	storageBucket: 'pubpub-rich.appspot.com',
// 	messagingSenderId: '543714905893',
// };

export const firebaseConfig = {
	apiKey: 'AIzaSyCVBq7I9ddJpHhs-DzVEEdM09-VqTVex1g',
	authDomain: 'pubpub-v6.firebaseapp.com',
	projectId: 'pubpub-v6',
	storageBucket: 'pubpub-v6.appspot.com',
	messagingSenderId: '503345633278',
	databaseURL: 'https://pubpub-v6-dev.firebaseio.com',
};

export const clientData = {
	id: 'storybook-clientid',
	name: 'Anon User',
	backgroundColor: 'rgba(0, 0, 250, 0.2)',
	cursorColor: 'rgba(0, 0, 250, 1.0)',
	image: 'https://s3.amazonaws.com/uifaces/faces/twitter/rickdt/128.jpg',
	initials: 'DR',
	canEdit: true,
};

export const initFirebase = (rootKey) => {
	const firebaseAppName = `App-${rootKey}`;
	/* Check if we've already initialized an Firebase App with the */
	/* same name in this local environment */
	const existingApp = firebase.apps.reduce((prev, curr) => {
		return curr.name === firebaseAppName ? curr : prev;
	}, undefined);

	/* Use the existing Firebase App or initialize a new one */
	const firebaseApp = existingApp || firebase.initializeApp(firebaseConfig, firebaseAppName);
	const database = firebase.database(firebaseApp);
	return database.ref(`${rootKey}`);
};
