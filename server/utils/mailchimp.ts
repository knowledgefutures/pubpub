import md5 from 'crypto-js/md5';

import { env } from 'server/env';

const key = env.MAILCHIMP_API_KEY;

const base = 'https://us5.api.mailchimp.com/3.0/lists';

const authHeader = `Basic ${Buffer.from(`pubpub-backend:${key}`).toString('base64')}`;

const emailHash = (email) => {
	return md5(email.toLowerCase()).toString();
};

const ensureTags = async (listId: string, memberId: string, sentTags: string[]) => {
	const tagsArr = sentTags.map((val) => ({ name: val, status: 'active' as const }));
	try {
		await fetch(`${base}/${listId}/members/${memberId}/tags`, {
			method: 'POST',
			headers: {
				Authorization: authHeader,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ tags: tagsArr }),
		});
	} catch (err) {
		console.warn(err);
	}
};

export const subscribeUser = async (email, list, tags) => {
	const subHash = emailHash(email);
	const response = await fetch(`${base}/${list}/members/${subHash}`, {
		method: 'PUT',
		headers: {
			Authorization: authHeader,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			email_address: email,
			status_if_new: 'pending',
			tags,
		}),
	});

	if (!response.ok) {
		console.warn(await response.text());
		return;
	}

	const body = await response.json();
	const tagsReceived = body.tags;
	if (!tags.every((val) => tagsReceived.includes(val))) {
		await ensureTags(body.list_id, body.id, tags);
	}
};

export const getListGrowth = async (list) => {
	const url = new URL(`${base}/${list}/growth-history`);
	url.searchParams.set('sort_field', 'month');
	url.searchParams.set('sort_dir', 'asc');

	const response = await fetch(url, {
		method: 'GET',
		headers: {
			Authorization: authHeader,
		},
	});

	return response.json();
};
