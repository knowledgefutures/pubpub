import { env } from 'server/env';

export async function purgeByUrl(url: string) {
	const res = await fetch(`https://api.fastly.com/purge/${url}`, {
		method: 'POST',
		headers: {
			'Fastly-Key': env.FASTLY_PURGE_TOKEN,
			Accept: 'application/json',
		},
	});
	const json = await res.json();
	if (!res.ok) {
		throw new Error(`Fastly purge failed: ${json?.msg || res.statusText}`);
	}
	return json;
}
