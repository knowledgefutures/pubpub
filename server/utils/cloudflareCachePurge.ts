import { env } from 'server/env';

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

export function isCachePurgeConfigured() {
	return Boolean(env.CLOUDFLARE_CACHE_PURGE_API_TOKEN && env.CLOUDFLARE_ZONE_TAG);
}

export async function purgeByUrls(urls: string[]) {
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

	const json = await res.json();
	if (!json.success) {
		const msgs = (json.errors ?? []).map((e: any) => e.message).join('; ');
		throw new Error(`Cloudflare cache purge failed: ${msgs || res.statusText}`);
	}
	return json;
}
