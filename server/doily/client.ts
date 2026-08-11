import { env } from 'server/env';
import { getFeatureFlagForUserAndCommunity } from 'server/featureFlag/queries';
import { Community } from 'server/models';

// Client for Doily, KF's DOI broker. When the `doilyDeposits` community
// feature flag is on (and DOILY_URL/DOILY_API_TOKEN are configured), Crossref
// deposits are delegated to Doily instead of the internal 4.4.1 pipeline:
// PubPub still builds its deposit JSON, Doily maps it to 5.4.0 records,
// registers them under the community's Doily organization, and owns polling.
//
// IMPORTANT (timestamp one-way door): Doily stamps deposits with
// YYYYMMDDhhmmss, which always exceeds our epoch-ms timestamps. Once Doily
// has touched a DOI, a legacy re-deposit of it is silently rejected by
// Crossref as stale. So once a community's flag is on, transient Doily
// failures must FAIL the request loudly — never fall back to the legacy path.
// Falling back is only safe for record types Doily rejects outright (422:
// conference, supplement), which the legacy path keeps owning by design.

export const DOILY_FLAG = 'doilyDeposits';

export const isDoilyConfigured = () => Boolean(env.DOILY_URL && env.DOILY_API_TOKEN);

export const isDoilyEnabledForCommunity = async (communityId: string) => {
	if (!isDoilyConfigured()) {
		return false;
	}
	try {
		return await getFeatureFlagForUserAndCommunity(null, communityId, DOILY_FLAG);
	} catch {
		// The flag row hasn't been created in this environment yet.
		return false;
	}
};

const doilyFetch = async (path: string, init?: RequestInit) => {
	const res = await fetch(`${env.DOILY_URL}${path}`, {
		...init,
		headers: {
			Authorization: `Bearer ${env.DOILY_API_TOKEN}`,
			'Content-Type': 'application/json',
			...init?.headers,
		},
	});
	return res;
};

/** Thrown when Doily rejects the record type — the legacy path handles it. */
export class DoilyUnsupportedRecordError extends Error {
	constructor(public reason: string) {
		super(`Doily does not handle this record type (${reason}); using the legacy path`);
	}
}

const orgIdByCommunityId = new Map<string, string>();

/**
 * One Doily organization per community (slug = subdomain). Provisioning
 * requires the community to be linked to a KF Auth org — Doily enforces
 * kfOrgId on every organization.
 */
export const resolveDoilyOrgId = async (communityId: string): Promise<string> => {
	const cached = orgIdByCommunityId.get(communityId);
	if (cached) {
		return cached;
	}

	const community = await Community.findOne({
		where: { id: communityId },
		attributes: ['id', 'subdomain', 'title', 'kfOrgId'],
	});
	if (!community) {
		throw new Error(`Community ${communityId} not found`);
	}

	const listRes = await doilyFetch('/v1/organizations');
	if (!listRes.ok) {
		throw new Error(`Doily organization lookup failed (${listRes.status})`);
	}
	const orgs = (await listRes.json()) as { id: string; slug: string }[];
	const existing = orgs.find((org) => org.slug === community.subdomain);
	if (existing) {
		orgIdByCommunityId.set(communityId, existing.id);
		return existing.id;
	}

	if (!community.kfOrgId) {
		throw new Error(
			`Community "${community.subdomain}" has no KF Auth org — link it before enabling ${DOILY_FLAG}`,
		);
	}
	const createRes = await doilyFetch('/v1/organizations', {
		method: 'POST',
		body: JSON.stringify({
			name: community.title,
			slug: community.subdomain,
			kfOrgId: community.kfOrgId,
		}),
	});
	if (!createRes.ok) {
		throw new Error(`Doily organization provisioning failed (${createRes.status})`);
	}
	const created = (await createRes.json()) as { id: string };
	orgIdByCommunityId.set(communityId, created.id);
	return created.id;
};

export type DoilyRecordResult = {
	doi: string;
	kind: string;
	depositId: string;
	status: string;
	batchId: string | null;
	action: 'created' | 'updated' | 'unchanged';
	submitted: boolean;
	blockers?: { code: string; message: string }[];
};

/**
 * Send a PubPub deposit JSON to Doily for mapping + submission. Throws on
 * hard blockers or transport failures (never silently falls back — see the
 * timestamp note above); throws DoilyUnsupportedRecordError for 422s.
 */
export const submitDepositViaDoily = async (options: {
	communityId: string;
	depositJson: unknown;
	primaryDoi: string;
}): Promise<{ organizationId: string; records: DoilyRecordResult[] }> => {
	const { communityId, depositJson, primaryDoi } = options;
	const organizationId = await resolveDoilyOrgId(communityId);

	const res = await doilyFetch('/v1/pubpub/deposits', {
		method: 'POST',
		body: JSON.stringify({ organizationId, depositJson, primaryDoi }),
	});

	if (res.status === 400) {
		const body = (await res.json()) as { reason?: string };
		throw new Error(`Doily deposit failed (${res.status}): ${body ?? 'unknown reason'}`);
	}

	if (res.status === 422) {
		const body = (await res.json()) as { reason?: string };
		throw new DoilyUnsupportedRecordError(body.reason ?? 'unsupported');
	}
	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Doily deposit failed (${res.status}): ${body.slice(0, 500)}`);
	}

	const { records } = (await res.json()) as { records: DoilyRecordResult[] };
	const primary =
		records.find((record) => record.doi === primaryDoi) ?? records[records.length - 1];
	if (primary && !primary.submitted && primary.action !== 'unchanged') {
		const messages = (primary.blockers ?? []).map((blocker) => blocker.message).join('; ');
		throw new Error(
			`Doily blocked the deposit of ${primary.doi}: ${messages || 'unknown reason'}`,
		);
	}

	return { organizationId, records };
};
