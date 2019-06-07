require('../../server/config.js');
const makeStorage = require('./storage');

const useProd = false;

const workingDirectory = process.env.MIGRATION_WORKING_DIRECTORY;
const storage = makeStorage(workingDirectory);

const getFirebaseConfig = function() {
	return {
		apiKey: 'AIzaSyCVBq7I9ddJpHhs-DzVEEdM09-VqTVex1g',
		authDomain: 'pubpub-v6.firebaseapp.com',
		projectId: 'pubpub-v6',
		storageBucket: 'pubpub-v6.appspot.com',
		messagingSenderId: '503345633278',
		databaseURL: useProd
			? 'https://pubpub-v6-prod.firebaseio.com'
			: 'https://pubpub-v6-dev.firebaseio.com',
	};
};

module.exports = {
	getFirebaseConfig: getFirebaseConfig,
	storage: storage,
	pubIds: storage
		.within('pubs')
		.contents()
		.filter((filename) => !filename.startsWith('.') && !filename.endsWith('.json')),
};
