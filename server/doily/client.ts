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

/**
 * Doily's slug cap. PubPub allows a 280-character subdomain, so a long one has
 * to be truncated before it is offered as a slug or provisioning 400s. The slug
 * is cosmetic now that the mapping is keyed on the community id, so truncating
 * loses nothing that matters.
 */
const DOILY_SLUG_MAX = 48;

const toDoilySlug = (subdomain: string) => subdomain.slice(0, DOILY_SLUG_MAX);

export type DoilyInstallation = {
	id: string;
	appId: string;
	externalId: string;
	/** Doily's current name for the thing that owns the deposits. */
	projectId?: string;
	/** Its previous name. Doily emits both for one release. */
	organizationId?: string;
};

/**
 * The id of the Doily record this community's deposits belong to.
 *
 * Doily renamed `organization` to `project` and emits both keys during the
 * transition. Reading both means PubPub works against a Doily on either side of
 * that rename, so neither repo has to deploy first and Doily can retire the
 * alias without waiting on us.
 */
export const installationTargetId = (installation: DoilyInstallation): string => {
	const id = installation.projectId ?? installation.organizationId;
	if (!id) {
		throw new Error(
			`Doily installation ${installation.id} named neither projectId nor organizationId`,
		);
	}
	return id;
};

/**
 * Ask Doily which organization it has installed us into for this community.
 *
 * Keyed on `community.id`, which is why this replaced a scan for
 * `org.slug === community.subdomain`: subdomains are editable, so after a
 * rename the slug scan missed, the provisioning path below treated the
 * community as new, and a second organization was created — future deposits
 * landing there while the DOI history stayed behind under the old one.
 */
const fetchInstallation = async (communityId: string): Promise<DoilyInstallation | null> => {
	const query = new URLSearchParams({ externalId: communityId });
	const res = await doilyFetch(`/v1/installations?${query.toString()}`);
	if (!res.ok) {
		throw new Error(`Doily installation lookup failed (${res.status})`);
	}
	const { installation } = (await res.json()) as { installation: DoilyInstallation | null };
	return installation;
};

/**
 * Persist the resolved id on the community. Doily's installation record is
 * authoritative; this column only spares the deposit path an HTTP round trip
 * per cold process, which is what the old process-local Map was for — except a
 * Map also made the fork bug non-deterministic per dyno and invisible to any
 * fix applied in the database.
 */
const cacheOrgId = async (communityId: string, organizationId: string) => {
	await Community.update({ doilyOrgId: organizationId }, { where: { id: communityId } });
};

const readDoilyOrgId = async (
	communityId: string,
): Promise<{ organizationId: string | null; cached: boolean }> => {
	const community = await Community.findOne({
		where: { id: communityId },
		attributes: ['id', 'doilyOrgId'],
	});
	if (!community) {
		throw new Error(`Community ${communityId} not found`);
	}
	if (community.doilyOrgId) {
		return { organizationId: community.doilyOrgId, cached: true };
	}
	const installation = await fetchInstallation(communityId);
	return {
		organizationId: installation ? installationTargetId(installation) : null,
		cached: false,
	};
};

/**
 * The Doily organization for this community, or null if there is not one yet.
 *
 * Reads only — no provisioning AND no cache write. The distinction matters
 * because tools/backfillDoilyDepositStatus.ts calls this in a dry run that
 * promises to modify nothing, so populating the cache is left to
 * resolveDoilyOrgId below, on the path that is already writing.
 */
export const findDoilyOrgId = async (communityId: string): Promise<string | null> => {
	const { organizationId } = await readDoilyOrgId(communityId);
	return organizationId;
};

/**
 * One Doily organization per community, installed against the community id.
 * Provisioning requires the community to be linked to a KF Auth org — Doily
 * enforces kfOrgId on every organization.
 */
export const resolveDoilyOrgId = async (communityId: string): Promise<string> => {
	const existing = await readDoilyOrgId(communityId);
	if (existing.organizationId) {
		if (!existing.cached) {
			await cacheOrgId(communityId, existing.organizationId);
		}
		return existing.organizationId;
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
	// One call, so there is no window in which the organization exists but the
	// installation naming it does not. Doily adopts an organization that already
	// carries this slug rather than creating a second one.
	const createRes = await doilyFetch('/v1/installations', {
		method: 'POST',
		body: JSON.stringify({
			externalId: community.id,
			organization: {
				name: community.title,
				slug: toDoilySlug(community.subdomain),
				kfOrgId: community.kfOrgId,
			},
		}),
	});
	if (!createRes.ok) {
		const body = await createRes.text();
		throw new Error(
			`Doily organization provisioning failed (${createRes.status}): ${body.slice(0, 500)}`,
		);
	}
	const { installation } = (await createRes.json()) as { installation: DoilyInstallation };
	const projectId = installationTargetId(installation);
	await cacheOrgId(communityId, projectId);
	return projectId;
};

/**
 * Install this app against an organization that already exists. Used by the
 * reconciliation tool, which knows the answer from PubPub's own deposit history
 * and only needs Doily to record it — never to pick an organization itself.
 */
export const installDoilyOrg = async (options: {
	communityId: string;
	organizationId: string;
}): Promise<DoilyInstallation> => {
	const res = await doilyFetch('/v1/installations', {
		method: 'POST',
		body: JSON.stringify({
			externalId: options.communityId,
			organizationId: options.organizationId,
		}),
	});
	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Doily installation failed (${res.status}): ${body.slice(0, 500)}`);
	}
	const { installation } = (await res.json()) as { installation: DoilyInstallation };
	return installation;
};

/**
 * Every organization this token can see. Only the reconciliation tool needs
 * this: the deposit path resolves by installation, and reintroducing a
 * list-and-scan there is what forked communities in the first place.
 */
export const listDoilyOrganizations = async (): Promise<{ id: string; slug: string }[]> => {
	const res = await doilyFetch('/v1/organizations');
	if (!res.ok) {
		throw new Error(`Doily organization listing failed (${res.status})`);
	}
	return (await res.json()) as { id: string; slug: string }[];
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
