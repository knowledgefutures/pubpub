import { env } from 'server/env';
import { isDuqDuq } from 'utils/environment';

import { shouldntPurge } from './skipPurgeConditions';

/**
 * Purge a surrogate tag from Fastly
 *
 * @param tag The tag to purge, this should be the domain
 * @param soft Whether to do a soft purge. This marks the content as stale and will serve stale
 *   content while the new content is being fetched
 * @throws {Error} If the purge action did not succeed, or if FASTLY_SERVICE_ID_${PROD|DUQDUQ} or
 *   FASTLY_PURGE_TOKEN_${PROD|DUQDUQ} is not set
 */
export const purgeSurrogateTag = async (tag: string, soft = false) => {
	let id: string;

	const duqduq = isDuqDuq();
	const modifiedTag = duqduq ? tag.replace('pubpub.org', 'duqduq.org') : tag;

	const shouldnt = shouldntPurge(modifiedTag);
	if (shouldnt) {
		console.log(shouldnt);
		return '';
	}

	// ? [env.FASTLY_SERVICE_ID_DUQDUQ, env.FASTLY_PURGE_TOKEN_DUQDUQ]
	const [serviceId, token] = [env.FASTLY_SERVICE_ID, env.FASTLY_PURGE_TOKEN];

	try {
		const purge = await fetch(
			`https://api.fastly.com/service/${serviceId}/purge/${modifiedTag}`,
			{
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Fastly-Key': token,
					...(soft ? { 'Fastly-Soft-Purge': '1' } : {}),
				},
			},
		);

		const response = await purge.json();

		if (response.status !== 'ok') {
			throw new Error(
				`Purge action on service ${
					duqduq ? 'DuqDuq' : 'prod'
				}/${serviceId} for ${modifiedTag} did not succeed.\n${response.msg}`,
			);
		}

		id = response.id as string;
	} catch (e: any) {
		throw new Error(
			`Purge action on service ${serviceId} for ${modifiedTag} did not succeed.\n${e}`,
		);
	}

	return id;
};

export async function purgeFastlyUrl(url: string) {
	try {
		const res = await fetch(`https://api.fastly.com/purge/${encodeURIComponent(url)}`, {
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
	} catch (e: any) {
		throw new Error(`URL purge action on service for ${url} did not succeed.\n${e}`);
	}
}

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

export function isCachePurgeConfigured() {
	return Boolean(env.CLOUDFLARE_CACHE_PURGE_API_TOKEN && env.CLOUDFLARE_ZONE_TAG);
}

export async function purgeCloudflareUrls(urls: string[]) {
	const apiToken = env.CLOUDFLARE_CACHE_PURGE_API_TOKEN;
	const zoneId = env.CLOUDFLARE_ZONE_TAG;
	if (!apiToken || !zoneId) {
		throw new Error(
			'Cloudflare cache purge not configured. Set CLOUDFLARE_CACHE_PURGE_API_TOKEN and CLOUDFLARE_ZONE_TAG.',
		);
	}

	const res = await fetch(`${CF_API_BASE}/zones/${zoneId}/purge_cache`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiToken}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ files: urls }),
	});

	let json: any = null;
	try {
		json = await res.json();
	} catch {
		// Cloudflare may not always return JSON
	}
	if (!res.ok || !json?.success) {
		const msgs = (json?.errors ?? []).map((e: any) => e.message).join('; ');
		throw new Error(`Cloudflare cache purge failed: ${msgs || res.statusText}`);
	}
	return json;
}
