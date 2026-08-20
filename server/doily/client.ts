import { createHash } from 'crypto';

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
 * Doily's slug cap. PubPub allows a 280-character subdomain, so a long one has to
 * be truncated before it is offered as a slug or provisioning 400s.
 */
const DOILY_SLUG_MAX = 48;
const DOILY_SLUG_SUFFIX_LENGTH = 6;

/**
 * The slug Doily provisions by, and the reason provisioning is safe to retry.
 *
 * Doily is idempotent by slug: a slug it already holds means the same thing
 * coming back. That only holds if the slug names exactly one community, and a
 * subdomain does not. Subdomains are editable, and two long ones sharing their
 * first 48 characters truncate to the same string, so matching on a bare
 * subdomain hands a new community somebody else's project and its DOI history.
 *
 * The suffix is what makes it specific: derived from `community.id`, which never
 * changes, and appended after truncation so it always survives. Two communities
 * cannot collide however their subdomains line up.
 *
 * It stops mattering the moment `doilyProjectId` is stored. After that every call
 * addresses the project by id, so the slug is free to be renamed on either side.
 */
const toDoilySlug = (subdomain: string, communityId: string) => {
	const suffix = createHash('sha256')
		.update(communityId)
		.digest('hex')
		.slice(0, DOILY_SLUG_SUFFIX_LENGTH);
	const room = DOILY_SLUG_MAX - suffix.length - 1;
	return `${subdomain.slice(0, room)}-${suffix}`;
};

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
 * Ask Doily which project it has installed us into for this community.
 *
 * Keyed on `community.id`, which is why this replaced a scan for
 * `project.slug === community.subdomain`: subdomains are editable, so after a
 * rename the slug scan missed, the provisioning path below treated the
 * community as new, and a second project was created: future deposits landing
 * there while the DOI history stayed behind under the old one.
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
 * authoritative: this column only spares the deposit path an HTTP round trip
 * per cold process, which is what the old process-local Map was for, except a
 * Map also made the fork bug non-deterministic per dyno and invisible to any
 * fix applied in the database.
 */
const cacheProjectId = async (communityId: string, projectId: string) => {
	await Community.update({ doilyProjectId: projectId }, { where: { id: communityId } });
};

const readDoilyProjectId = async (
	communityId: string,
): Promise<{ projectId: string | null; cached: boolean }> => {
	const community = await Community.findOne({
		where: { id: communityId },
		attributes: ['id', 'doilyProjectId'],
	});
	if (!community) {
		throw new Error(`Community ${communityId} not found`);
	}
	if (community.doilyProjectId) {
		return { projectId: community.doilyProjectId, cached: true };
	}
	const installation = await fetchInstallation(communityId);
	return {
		projectId: installation ? installationTargetId(installation) : null,
		cached: false,
	};
};

/**
 * The Doily project for this community, or null if there is not one yet.
 *
 * Reads only: no provisioning AND no cache write. The distinction matters
 * because tools/backfillDoilyDepositStatus.ts calls this in a dry run that
 * promises to modify nothing, so populating the cache is left to
 * resolveDoilyProjectId below, on the path that is already writing.
 */
export const findDoilyProjectId = async (communityId: string): Promise<string | null> => {
	const { projectId } = await readDoilyProjectId(communityId);
	return projectId;
};

/**
 * One Doily project per community, installed against the community id.
 * Provisioning requires the community to be linked to a KF Auth org: Doily
 * enforces kfOrgId on every project.
 */
export const resolveDoilyProjectId = async (communityId: string): Promise<string> => {
	const existing = await readDoilyProjectId(communityId);
	if (existing.projectId) {
		if (!existing.cached) {
			await cacheProjectId(communityId, existing.projectId);
		}
		return existing.projectId;
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
	// One call, so there is no window in which the project exists but the
	// installation naming it does not. Doily adopts a project that already
	// carries this slug rather than creating a second one.
	//
	// `project` and not `organization`: Doily's install schema takes both, but
	// `organization` is the retired spelling it keeps alive for one release only
	// so the two repos need not deploy together. Once Doily drops the alias its
	// "exactly one of projectId or project" check fails, provisioning 400s, and
	// every community without a cached doilyProjectId stops depositing.
	const createRes = await doilyFetch('/v1/installations', {
		method: 'POST',
		body: JSON.stringify({
			externalId: community.id,
			project: {
				name: community.title,
				slug: toDoilySlug(community.subdomain, community.id),
				kfOrgId: community.kfOrgId,
			},
		}),
	});
	if (!createRes.ok) {
		const body = await createRes.text();
		throw new Error(
			`Doily project provisioning failed (${createRes.status}): ${body.slice(0, 500)}`,
		);
	}
	const { installation } = (await createRes.json()) as { installation: DoilyInstallation };
	const projectId = installationTargetId(installation);
	await cacheProjectId(communityId, projectId);
	return projectId;
};

/**
 * Install this app against a project that already exists. Used by the
 * reconciliation tool, which knows the answer from PubPub's own deposit history
 * and only needs Doily to record it: never to pick a project itself.
 */
export const installDoilyOrg = async (options: {
	communityId: string;
	projectId: string;
}): Promise<DoilyInstallation> => {
	const res = await doilyFetch('/v1/installations', {
		method: 'POST',
		body: JSON.stringify({
			externalId: options.communityId,
			projectId: options.projectId,
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
 * Every project this token can see. Only the reconciliation tool needs this: the
 * deposit path resolves by installation, and reintroducing a list-and-scan there
 * is what forked communities in the first place.
 *
 * Deliberately /v1/projects and not /v1/organizations. Doily renamed the record
 * that owns the deposits to `project` and then reused `organization` for the
 * tenant ABOVE it, so the old path now answers about a different thing entirely
 * — one organization can own many projects, and matching a community subdomain
 * against it would resolve to the wrong level.
 */
export const listDoilyProjects = async (): Promise<{ id: string; slug: string }[]> => {
	const res = await doilyFetch('/v1/projects');
	if (!res.ok) {
		throw new Error(`Doily project listing failed (${res.status})`);
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
 * One page of a project's deposits. Used by the status backfill, which
 * pages through every deposit Doily holds for a community and matches on DOI,
 * the only join available for rows deposited before PubPub recorded Doily's
 * deposit id.
 */
export const listDoilyDeposits = async (options: {
	projectId: string;
	limit: number;
	offset: number;
}): Promise<{ items: DoilyDepositSummary[]; total: number }> => {
	const { projectId, limit, offset } = options;
	const query = new URLSearchParams({
		projectId,
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
}): Promise<{ projectId: string; records: DoilyRecordResult[] }> => {
	const { communityId, depositJson, primaryDoi } = options;
	const projectId = await resolveDoilyProjectId(communityId);

	const res = await doilyFetch('/v1/pubpub/deposits', {
		method: 'POST',
		body: JSON.stringify({ projectId, depositJson, primaryDoi }),
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

	return { projectId, records };
};
