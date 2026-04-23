/**
 * Cloudflare Custom Hostnames API client.
 *
 * Manages custom hostnames for community custom domains via the Cloudflare
 * SSL for SaaS (Custom Hostnames) API.
 *
 * Required env vars:
 *   CLOUDFLARE_CUSTOM_HOSTNAME_API_TOKEN – API token with SSL & Hostnames:Edit
 *   CLOUDFLARE_ZONE_TAG                   – Zone ID (shared with analytics)
 */

import { env } from 'server/env';

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

function getConfig() {
	const apiToken = env.CLOUDFLARE_CUSTOM_HOSTNAME_API_TOKEN;
	const zoneId = env.CLOUDFLARE_ZONE_TAG;
	if (!apiToken || !zoneId) {
		return null;
	}
	return { apiToken, zoneId };
}

async function cfFetch(path: string, options: RequestInit = {}) {
	const config = getConfig();
	if (!config) {
		throw new Error(
			'Cloudflare custom hostnames not configured. Set CLOUDFLARE_CUSTOM_HOSTNAME_API_TOKEN and CLOUDFLARE_ZONE_TAG.',
		);
	}
	const url = `${CF_API_BASE}/zones/${config.zoneId}${path}`;
	const res = await fetch(url, {
		...options,
		headers: {
			Authorization: `Bearer ${config.apiToken}`,
			'Content-Type': 'application/json',
			...((options.headers as Record<string, string>) ?? {}),
		},
	});
	const json = await res.json();
	if (!json.success) {
		const msgs = (json.errors ?? []).map((e: any) => e.message).join('; ');
		throw new Error(`Cloudflare API error: ${msgs || res.statusText}`);
	}
	return json;
}

export async function addCustomHostname(hostname: string) {
	return cfFetch('/custom_hostnames', {
		method: 'POST',
		body: JSON.stringify({
			hostname,
			ssl: {
				method: 'http',
				type: 'dv',
			},
		}),
	});
}

export async function removeCustomHostname(hostname: string) {
	// First find the custom hostname ID by listing and filtering
	const listRes = await cfFetch(`/custom_hostnames?hostname=${encodeURIComponent(hostname)}`);
	const entry = (listRes.result ?? []).find((r: any) => r.hostname === hostname);
	if (!entry) {
		// Already removed or never existed — treat as success
		return { success: true };
	}
	return cfFetch(`/custom_hostnames/${entry.id}`, { method: 'DELETE' });
}

export function isCloudflareConfigured() {
	return getConfig() !== null;
}
