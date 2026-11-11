import type { RelationTypeName } from 'utils/pubEdge/relations';

import cheerio from 'cheerio';

import { env } from 'server/env';
import { type ExternalPublication, type Pub, PubEdge } from 'server/models';
import { getPubEdgeIncludes } from 'server/utils/queryHelpers/pubEdgeOptions';
import { pubEdgeQueries, runQueries } from 'server/utils/scrape';
import { extractDoiFromUrl } from 'utils/crossref/parseDoi';
import { assignNotNull } from 'utils/objects';
import { parseUrl } from 'utils/urls';

export type RelationshipIssue = {
	type:
		| 'internal_not_deposited'
		| 'external_doi_not_in_crossref'
		| 'external_doi_not_crossref_registrar'
		| 'external_url_no_doi_found'
		| 'crossref_unreachable';
	message: string;
	edgeId: string;
	targetTitle: string;
	targetDoi?: string;
	targetUrl?: string;
	relationType: RelationTypeName;
	targetPubId?: string;
	targetPubSlug?: string;
	targetCommunitySubdomain?: string;
};

type PubEdgeWithRelations = PubEdge & {
	targetPub?: Pub & { community?: { subdomain: string } };
	pub?: Pub & { community?: { subdomain: string } };
	externalPublication?: ExternalPublication;
};

const REVIEW_RELATION_TYPES: RelationTypeName[] = ['review', 'rejoinder'];

const isReviewRelationType = (relationType: RelationTypeName) =>
	REVIEW_RELATION_TYPES.includes(relationType);

const isTestEnvironment = () => {
	const submissionUrl = env.DOI_SUBMISSION_URL ?? '';
	return submissionUrl.includes('test') || submissionUrl.includes('sandbox');
};

const checkDoiRegistrar = async (doi: string): Promise<'crossref' | 'other' | 'unknown'> => {
	try {
		const response = await fetch(`https://doi.org/ra/${doi}`);
		if (!response.ok) {
			return 'unknown';
		}
		const data = (await response.json()) as Array<{ RA?: string }>;
		if (data[0]?.RA?.toLowerCase() === 'crossref') {
			return 'crossref';
		}
		return 'other';
	} catch {
		return 'unknown';
	}
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Whether the DOI registry has this DOI registered with Crossref: true, false, or null if the
 * registry couldn't be asked. A DOI registered with another agency (DataCite) counts as not in
 * Crossref.
 */
const isRegisteredWithCrossref = async (doi: string): Promise<boolean | null> => {
	try {
		const response = await fetch(`https://doi.org/ra/${doi}`, {
			signal: AbortSignal.timeout(8000),
		});
		if (!response.ok) return null;
		const [entry] = (await response.json()) as Array<{ RA?: string; status?: string }>;
		if (entry?.RA) return entry.RA.toLowerCase() === 'crossref';
		if (entry?.status?.toLowerCase().includes('does not exist')) return false;
		return null;
	} catch {
		return null;
	}
};

type CrossrefPresence = { exists: true } | { exists: false } | { exists: null; reason: string };

// useTestApi: for internal dois, use the test api in test environment
const checkDoiExistsInCrossref = async (doi: string): Promise<CrossrefPresence> => {
	if (!isTestEnvironment()) {
		// Only a 404 means the DOI isn't there. Rate limits and server errors are retried, and
		// reported as "couldn't check" if they persist, so a busy API never reads as a missing DOI.
		let reason = '';
		for (const delay of [0, 1000, 3000]) {
			if (delay) {
				// biome-ignore lint/performance/noAwaitInLoops: retry backoff
				await sleep(delay);
			}
			try {
				const response = await fetch(
					`https://api.crossref.org/works/${doi}?mailto=dev@pubpub.org`,
					{ signal: AbortSignal.timeout(8000) },
				);
				if (response.ok) return { exists: true };
				if (response.status === 404) {
					// Crossref's API can take a while to index a newly registered DOI, so ask the
					// DOI registry itself before calling it missing.
					const registered = await isRegisteredWithCrossref(doi);
					if (registered === null) {
						return { exists: null, reason: "the DOI registry didn't answer" };
					}
					return { exists: registered };
				}
				reason = `Crossref returned ${response.status}`;
			} catch (err: any) {
				reason = `Crossref didn't respond (${err?.message ?? err})`;
			}
		}
		return { exists: null, reason };
	}
	try {
		const response = await fetch(
			`https://test.crossref.org/search/doi?usr=dev@pubpub.org&doi=${encodeURIComponent(doi)}`,
		);
		if (!response.ok) {
			return { exists: false };
		}
		const xml = await response.text();
		console.log('response for test api', doi, xml);

		return xml.includes('status="resolved"') ? { exists: true } : { exists: false };
	} catch {
		return { exists: false };
	}
};

const unreachableIssue = (
	edge: PubEdgeWithRelations,
	doi: string,
	title: string,
	reason: string,
): RelationshipIssue => ({
	type: 'crossref_unreachable',
	message: `Couldn't check whether DOI ${doi} for "${title}" is in Crossref (${reason}). Try again in a few minutes.`,
	edgeId: edge.id,
	targetTitle: title,
	targetDoi: doi,
	relationType: edge.relationType,
});

const createExternalPublicationFromMicrodata = ($: ReturnType<typeof cheerio.load>) => {
	const script = $('script[type="application/ld+json"]').get(0);
	if (!script) {
		return {};
	}

	try {
		const parsed = JSON.parse($(script as any).html() || '');
		return {
			title: parsed.headline || parsed.alternativeHeadline || null,
			description: parsed.description || null,
			contributors: parsed.author ? parsed.author.map((p: { name: string }) => p.name) : [],
			publicationDate: parsed.datePublished ? new Date(parsed.datePublished) : null,
		};
	} catch {
		return {};
	}
};

const extractDoiFromWebPage = async (url: string): Promise<string | null> => {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			return null;
		}

		const $ = cheerio.load(await response.text());
		const fromSelectors = runQueries($, pubEdgeQueries);
		const fromMicrodata = createExternalPublicationFromMicrodata($);
		const combined = assignNotNull({}, fromMicrodata, fromSelectors);
		return combined.doi || null;
	} catch {
		return null;
	}
};

const getEdgeTarget = (edge: PubEdgeWithRelations, isInbound: boolean) => {
	if (edge.externalPublication) {
		return { type: 'external' as const, externalPublication: edge.externalPublication };
	}

	const targetPub = isInbound ? edge.pub : edge.targetPub;
	if (targetPub) {
		return { type: 'internal' as const, pub: targetPub };
	}

	return null;
};

const checkEdgeForIssues = async (
	edge: PubEdgeWithRelations,
	isInbound: boolean,
): Promise<RelationshipIssue | null> => {
	const target = getEdgeTarget(edge, isInbound);
	if (!target) {
		return null;
	}

	if (target.type === 'internal') {
		const { pub } = target;
		if (!pub.doi) {
			return null;
		}

		const presence = await checkDoiExistsInCrossref(pub.doi);
		if (presence.exists) {
			return null;
		}
		if (presence.exists === null) {
			return unreachableIssue(edge, pub.doi, pub.title, presence.reason);
		}

		return {
			type: 'internal_not_deposited',
			message: `"${pub.title}" has DOI ${pub.doi} assigned but it does not exist in Crossref. Deposit "${pub.title}" first, or disconnect it and deposit this Pub first.`,
			edgeId: edge.id,
			targetTitle: pub.title,
			targetDoi: pub.doi,
			relationType: edge.relationType,
			targetPubId: pub.id,
			targetPubSlug: pub.slug,
			targetCommunitySubdomain: pub.community?.subdomain,
		};
	}

	// strict doi validation only for reviews
	const isReview = isReviewRelationType(edge.relationType);
	if (!isReview) {
		return null;
	}

	const { externalPublication } = target;
	const doi = externalPublication.doi ?? extractDoiFromUrl(parseUrl(externalPublication.url));

	if (doi) {
		const registrar = await checkDoiRegistrar(doi);
		if (registrar === 'other') {
			return {
				type: 'external_doi_not_crossref_registrar',
				message: `DOI ${doi} for "${externalPublication.title}" is not a Crossref DOI. Peer reviews can only link to Crossref DOIs.`,
				edgeId: edge.id,
				targetTitle: externalPublication.title,
				targetDoi: doi,
				relationType: edge.relationType,
			};
		}

		const presence = await checkDoiExistsInCrossref(doi);
		if (presence.exists === null) {
			return unreachableIssue(edge, doi, externalPublication.title, presence.reason);
		}
		if (!presence.exists) {
			return {
				type: 'external_doi_not_in_crossref',
				message: `DOI ${doi} for "${externalPublication.title}" was not found in Crossref.`,
				edgeId: edge.id,
				targetTitle: externalPublication.title,
				targetDoi: doi,
				relationType: edge.relationType,
			};
		}

		return null;
	}

	if (externalPublication.url) {
		const foundDoi = await extractDoiFromWebPage(externalPublication.url);
		if (foundDoi) {
			const registrar = await checkDoiRegistrar(foundDoi);
			if (registrar === 'other') {
				return {
					type: 'external_doi_not_crossref_registrar',
					message: `DOI ${foundDoi} for "${externalPublication.title}" is not a Crossref DOI. Peer reviews can only link to Crossref DOIs.`,
					edgeId: edge.id,
					targetTitle: externalPublication.title,
					targetDoi: foundDoi,
					targetUrl: externalPublication.url,
					relationType: edge.relationType,
				};
			}

			const presence = await checkDoiExistsInCrossref(foundDoi);
			if (presence.exists === null) {
				return unreachableIssue(edge, foundDoi, externalPublication.title, presence.reason);
			}
			if (!presence.exists) {
				return {
					type: 'external_doi_not_in_crossref',
					message: `DOI ${foundDoi} for "${externalPublication.title}" was not found in Crossref.`,
					edgeId: edge.id,
					targetTitle: externalPublication.title,
					targetDoi: foundDoi,
					targetUrl: externalPublication.url,
					relationType: edge.relationType,
				};
			}

			return null;
		}

		return {
			type: 'external_url_no_doi_found',
			message: `Could not find a DOI for "${externalPublication.title}". Please add a DOI manually to the connection.`,
			edgeId: edge.id,
			targetTitle: externalPublication.title,
			targetUrl: externalPublication.url,
			relationType: edge.relationType,
		};
	}

	return null;
};

export const validatePubRelationshipsForDeposit = async (
	pubId: string,
): Promise<RelationshipIssue[]> => {
	const [edges, inboundEdges] = await Promise.all([
		PubEdge.findAll({
			where: { pubId },
			include: getPubEdgeIncludes({ includeTargetPub: true, includeCommunityForPubs: true }),
		}),
		PubEdge.findAll({
			where: { targetPubId: pubId },
			include: getPubEdgeIncludes({ includePub: true, includeCommunityForPubs: true }),
		}),
	]);

	const [edgeIssues, inboundIssues] = await Promise.all([
		Promise.all(
			(edges as PubEdgeWithRelations[]).map((edge) => checkEdgeForIssues(edge, false)),
		),
		Promise.all(
			(inboundEdges as PubEdgeWithRelations[]).map((edge) => checkEdgeForIssues(edge, true)),
		),
	]);

	return [...edgeIssues, ...inboundIssues].filter(
		(issue): issue is RelationshipIssue => issue !== null,
	);
};
