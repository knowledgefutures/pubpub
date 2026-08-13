import { env } from 'server/env';
import { getFeatureFlagForUserAndCommunity } from 'server/featureFlag/queries';
import { Community } from 'server/models';

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
 * The Doily organization for this community, or null if there is not one yet.
 * Never provisions: a read-only caller (the status backfill) has to be able to
 * ask the question without creating an organization as a side effect.
 */
export const findDoilyOrgId = async (communityId: string): Promise<string | null> => {
	const cached = orgIdByCommunityId.get(communityId);
	if (cached) {
		return cached;
	}

	const community = await Community.findOne({
		where: { id: communityId },
		attributes: ['id', 'subdomain'],
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
	if (!existing) {
		return null;
	}
	orgIdByCommunityId.set(communityId, existing.id);
	return existing.id;
};

/**
 * One Doily organization per community (slug = subdomain). Provisioning
 * requires the community to be linked to a KF Auth org — Doily enforces
 * kfOrgId on every organization.
 */
export const resolveDoilyOrgId = async (communityId: string): Promise<string> => {
	const existing = await findDoilyOrgId(communityId);
	if (existing) {
		return existing;
	}

	const community = await Community.findOne({
		where: { id: communityId },
		attributes: ['id', 'subdomain', 'title', 'kfOrgId'],
	});
	if (!community) {
		throw new Error(`Community ${communityId} not found`);
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
 * The record a deposit's state should be read from. A PubPub deposit can create
 * several Doily records at once (a pub plus the collection it appears in), and
 * only the one carrying the DOI we asked for describes this work. The trailing
 * fallback covers Doily returning a single record whose DOI it normalized.
 */
export const findPrimaryDoilyRecord = (
	records: DoilyRecordResult[],
	primaryDoi: string,
): DoilyRecordResult | undefined =>
	records.find((record) => record.doi === primaryDoi) ?? records[records.length - 1];

export type DoilyDepositSummary = {
	id: string;
	doi: string | null;
	status: string;
	error: string | null;
	batchId: string | null;
	registeredAt: string | null;
	updatedAt: string;
};

/**
 * One page of an organization's deposits. Used by the status backfill, which
 * pages through every deposit Doily holds for a community and matches on DOI,
 * the only join available for rows deposited before PubPub recorded Doily's
 * deposit id.
 */
export const listDoilyDeposits = async (options: {
	organizationId: string;
	limit: number;
	offset: number;
}): Promise<{ items: DoilyDepositSummary[]; total: number }> => {
	const { organizationId, limit, offset } = options;
	const query = new URLSearchParams({
		organizationId,
		limit: String(limit),
		offset: String(offset),
	});
	const res = await doilyFetch(`/v1/deposits?${query.toString()}`);
	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Doily deposit listing failed (${res.status}): ${body.slice(0, 500)}`);
	}
	return (await res.json()) as { items: DoilyDepositSummary[]; total: number };
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
	const primary = findPrimaryDoilyRecord(records, primaryDoi);
	if (primary && !primary.submitted && primary.action !== 'unchanged') {
		const messages = (primary.blockers ?? []).map((blocker) => blocker.message).join('; ');
		throw new Error(
			`Doily blocked the deposit of ${primary.doi}: ${messages || 'unknown reason'}`,
		);
	}

	return { organizationId, records };
};
