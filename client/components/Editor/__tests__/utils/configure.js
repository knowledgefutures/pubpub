/* global beforeAll, afterAll */
import uuid from 'uuid';
import firebase from 'firebase/app';
import 'firebase/database';
import FirebaseServer from 'firebase-server';
import { loadDocAndStepsFromDir } from './loadData';

const dbHost = 'localhost';
const dbPort = 5000;

let firebaseServer;
let firebaseClient;

export const getFirebaseServer = (content = {}, refresh = false) => {
	if (!firebaseServer || refresh) {
		firebaseServer = new FirebaseServer(dbPort, dbHost, content);
	}
	return firebaseServer;
};

export const getOrInitializeFirebaseClient = () => {
	if (!firebaseClient) {
		firebaseClient = firebase
			.initializeApp({
				databaseURL: `ws://${dbHost}:${dbPort}`,
			})
			.database();
	}
	return firebaseClient;
};

export const getFirebaseRef = (childId) => {
	return getOrInitializeFirebaseClient().ref(childId);
};

export const configureTest = (dataDir) => {
	const id = uuid.v4(Date.now().toString());
	const { branch, doc } = loadDocAndStepsFromDir(dataDir);

	beforeAll(() => {
		getOrInitializeFirebaseClient();
		getFirebaseServer({ [id]: branch }, true);
	});

	afterAll(() => {
		if (firebaseServer) {
			firebaseServer.close();
		}
	});

	return {
		branch: branch,
		doc: doc,
		branchRef: getFirebaseRef(id),
	};
};
