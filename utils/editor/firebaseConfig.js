import { isProd } from 'utils/environment';

export const getFirebaseConfig = () => {
	return {
		apiKey: 'AIzaSyCVBq7I9ddJpHhs-DzVEEdM09-VqTVex1g',
		authDomain: 'pubpub-v6.firebaseapp.com',
		projectId: 'pubpub-v6',
		storageBucket: 'pubpub-v6.appspot.com',
		messagingSenderId: '503345633278',
		databaseURL: isProd()
			? 'https://pubpub-v6-prod.firebaseio.com'
			: 'https://pubpub-v6-dev.firebaseio.com',
	};
};
