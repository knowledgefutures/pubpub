/* eslint-disable import/prefer-default-export */

import request from 'request-promise';
import md5 from 'crypto-js/md5';

const key = process.env.MAILCHIMP_API_KEY;

const base = 'https://us2.api.mailchimp.com/3.0/lists';

const emailHash = (email) => {
	return md5(email.toLowerCase);
};

export const subscribeUser = (email, list) => {
	const subHash = emailHash(email);
	const options = {
		method: 'PUT',
		auth: {
			user: 'foo',
			password: key
		},
		uri: `${base}/${list}/members/${subHash}`,
		body: {
			email_address: email,
			status_if_new: 'pending'
		},
		json: true
	};

	return request(options);
};
