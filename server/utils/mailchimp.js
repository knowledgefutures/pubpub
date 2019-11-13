import request from 'request-promise';
import md5 from 'crypto-js/md5';

const key = process.env.MAILCHIMP_API_KEY;

const base = 'https://us5.api.mailchimp.com/3.0/lists';

const emailHash = (email) => {
	return md5(email.toLowerCase()).toString();
};

const callback = (error, response, body) => {
	if (response.statusCode !== 200) {
		console.warn(body);
	} else {
		const list = response.body.list_id;
		const member = response.body.id;
		const tagsSent = JSON.parse(response.request.body).tags;
		const tagsReceived = response.body.tags;
		if (!tagsSent.every((val) => tagsReceived.includes(val))) {
			const tagsArr = [];
			tagsSent.map((val) => tagsArr.push({ name: val, status: 'active' }));
			const options = {
				method: 'POST',
				auth: {
					user: 'pubpub-backend',
					password: key,
				},
				uri: `${base}/${list}/members/${member}/tags`,
				body: {
					tags: tagsArr,
				},
				json: true,
			};
			request(options)
				.then()
				.catch((err) => {
					console.warn(err);
				});
		}
	}
	return false;
};

export const subscribeUser = (email, list, tags) => {
	const subHash = emailHash(email);
	const options = {
		method: 'PUT',
		auth: {
			user: 'pubpub-backend',
			password: key,
		},
		uri: `${base}/${list}/members/${subHash}`,
		body: {
			email_address: email,
			status_if_new: 'pending',
			tags: tags,
		},
		json: true,
	};
	return request(options, callback);
};

export const getListGrowth = (list) => {
	const options = {
		method: 'GET',
		auth: {
			user: 'pubpub-backend',
			password: key,
		},
		uri: `${base}/${list}/growth-history`,
		qs: {
			sort_field: 'month',
			sort_dir: 'asc',
		},
		json: true,
	};
	return request(options);
};
