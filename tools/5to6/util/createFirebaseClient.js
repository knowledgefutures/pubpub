/* eslint-disable no-console */
const { google } = require('google-auth-library');
const request = require('request');

const TOKEN_EXPIRY_MINS = 30;

const GOOGLE_SCOPES = [
	'https://www.googleapis.com/auth/userinfo.email',
	'https://www.googleapis.com/auth/firebase.database',
];

const createReader = (baseUrl, getAccessToken) => (pubId) =>
	new Promise(async (resolve, reject) => {
		const accessToken = await getAccessToken();
		const url = `${baseUrl}/pub-${pubId}.json`;
		request(
			url,
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-type': 'text/json',
				},
			},
			(error, response, body) => {
				if (error) {
					reject(error);
				} else if (response.statusCode >= 200 && response.statusCode <= 299) {
					resolve(body);
				} else {
					reject(new Error(`Got status ${response.statusCode}: ${body}`));
				}
			},
		);
	});

const createWriter = (baseUrl, getAccessToken) => (pubId, jsonBody) =>
	new Promise(async (resolve, reject) => {
		const accessToken = await getAccessToken();
		const url = `${baseUrl}/pub-${pubId}.json?writeSizeLimit=unlimited`;
		request(
			url,
			{
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-type': 'text/json',
				},
				body: JSON.stringify(jsonBody),
			},
			(error, response, body) => {
				if (error) {
					reject(error);
				} else if (response.statusCode >= 200 && response.statusCode <= 299) {
					resolve();
				} else {
					reject(new Error(`Got status ${response.statusCode}: ${body}`));
				}
			},
		);
	});

const createFirebaseClient = (url, serviceAccountB64) => {
	const serviceAccount = JSON.parse(Buffer.from(serviceAccountB64, 'base64').toString());
	let lastAccessToken = null;
	let lastAccessTokenGenerated = null;

	const generateAccessToken = async () =>
		new Promise((resolve, reject) => {
			const jwtClient = new google.auth.JWT(
				serviceAccount.client_email,
				null,
				serviceAccount.private_key,
				GOOGLE_SCOPES,
			);
			// Use the JWT client to generate an access token.
			jwtClient.authorize((error, tokens) => {
				if (error) {
					reject(error);
				} else if (tokens.access_token === null) {
					reject(
						new Error(
							'Provided service account does not have permission to generate access tokens',
						),
					);
				} else {
					console.log(
						'New access token expires at',
						new Date(tokens.expiry_date).toString(),
					);
					resolve(tokens.access_token);
				}
			});
		});

	const getAccessToken = async () => {
		const now = Date.now();
		const needsAccessToken =
			!lastAccessToken ||
			!lastAccessTokenGenerated ||
			now - lastAccessTokenGenerated > 1000 * 60 * TOKEN_EXPIRY_MINS;
		if (needsAccessToken) {
			console.log('Generating new Firebase access token...');
			const accessToken = await generateAccessToken();
			lastAccessToken = accessToken;
			lastAccessTokenGenerated = now;
			return accessToken;
		}
		return lastAccessToken;
	};

	return {
		reader: createReader(url, getAccessToken),
		writer: createWriter(url, getAccessToken),
	};
};

module.exports = createFirebaseClient;
