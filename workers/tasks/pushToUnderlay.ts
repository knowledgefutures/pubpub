import type { DocJson } from 'types';

import { env } from 'server/env';
import { fetchFacetsForScopeIds } from 'server/facets';
import {
	Collection,
	CollectionPub,
	Community,
	Doc,
	ExternalPublication,
	includeUserModel,
	Pub,
	PubAttribution,
	PubEdge,
	Release,
} from 'server/models';
import { expect } from 'utils/assert';
import { getAssetUrlFromResizedUrl } from 'utils/images';

import { formatUnderlayError, UnderlayClient } from '../../server/underlay/client';
import { hashBytes } from '../../server/underlay/hash';
import { buildIncrementalPush, computeFacetsSignature } from '../../server/underlay/incremental';
import {
	type CollectionInput,
	type CommunityInput,
	mapPubRecords,
	type PubInput,
	type UnderlayFile,
} from '../../server/underlay/mapping';
import {
	getUnderlayIntegrationWithKey,
	recordPushResult,
} from '../../server/underlayIntegration/queries';
import { applyPushCache, getPushCacheEntries } from '../../server/underlayPushEntry/queries';
import { getReleaseHtml } from './communityExport';

type PushToUnderlayInput = {
	communityId: string;
	workerTaskId?: string;
};

const RENDER_FACET_NAMES = [
	'CitationStyle',
	'License',
	'NodeLabels',
	'PubEdgeDisplay',
	'PubHeaderTheme',
] as const;

/**
 * Push a community's content to its configured Underlay collection.
 *
 * We push RELEASES (immutable frozen Doc snapshots), never the live Firebase draft, so the mapping
 * is deterministic and re-pushes with no changes are a no-op (guarded by a manifest signature).
 *
 * Pubs are hydrated cheaply first (no ProseMirror docs); the expensive doc load + HTML render +
 * asset fetch happens only for pubs whose content changed since the last push (see the push cache in
 * server/underlay/incremental.ts). Unchanged pubs contribute their cached hashes to the manifest.
 */
export const pushToUnderlayTask = async (input: PushToUnderlayInput) => {
	const { communityId } = input;
	const community = expect(await Community.findByPk(communityId));

	const withKey = await getUnderlayIntegrationWithKey(communityId);
	if (!withKey?.apiKey) {
		throw new Error('Underlay integration has no API key configured.');
	}
	const { integration, apiKey } = withKey;
	if (!integration.underlayOrg || !integration.underlayCollection) {
		throw new Error('Underlay integration is missing an org or collection.');
	}

	const client = new UnderlayClient({
		apiKey,
		owner: integration.underlayOrg,
		slug: integration.underlayCollection,
		baseUrl: env.UNDERLAY_API_BASE_URL ?? undefined,
		appId: 'pubpub',
		actorId: `pubpub:community:${communityId}`,
	});

	try {
		console.info(
			`[underlay] Starting push for community ${community.subdomain} (${communityId}) → ${integration.underlayOrg}/${integration.underlayCollection}`,
		);

		// Verify the connection BEFORE any expensive mapping/rendering, so a bad API key, wrong
		// base URL, or inaccessible org fails fast with a specific reason in the logs.
		const check = await client.verifyConnection();
		for (const step of check.steps) {
			console.info(
				`[underlay] connection check — ${step.name}: ${step.ok ? 'ok' : 'FAILED'} (${step.message})`,
			);
		}
		if (!check.ok) {
			throw new Error(`Underlay connection check failed: ${check.message}`);
		}

		const collections = await Collection.findAll({ where: { communityId } });

		// Cheap hydration: attributions, collectionPubs, edges, and release metadata — but NOT the
		// ProseMirror docs. Docs are loaded lazily per pub only when that pub must be (re)rendered.
		const pubs = await Pub.findAll({
			where: { communityId },
			include: [
				{
					model: Release,
					as: 'releases',
					separate: true,
					order: [['historyKey', 'ASC']],
				},
				{
					model: PubAttribution,
					as: 'attributions',
					include: [includeUserModel({ as: 'user' })],
				},
				{ model: CollectionPub, as: 'collectionPubs' },
				{
					model: PubEdge,
					as: 'outboundEdges',
					include: [{ model: ExternalPublication, as: 'externalPublication' }],
				},
			],
			order: [['createdAt', 'ASC']],
		});

		const facets = await fetchFacetsForScopeIds({ pub: pubs.map((p) => p.id) }, [
			...RENDER_FACET_NAMES,
		]);

		// Release → docId and pub → releaseIds, so docs can be fetched lazily by pub.
		const docIdByReleaseId = new Map<string, string>();
		const releaseIdsByPubId = new Map<string, string[]>();
		const attributionsByPubId = new Map<string, unknown[]>();
		for (const pub of pubs) {
			attributionsByPubId.set(
				pub.id,
				(pub.attributions ?? []).map((a) => a.toJSON()),
			);
			const releaseIds: string[] = [];
			for (const release of pub.releases ?? []) {
				releaseIds.push(release.id);
				if (release.docId) {
					docIdByReleaseId.set(release.id, release.docId);
				}
			}
			releaseIdsByPubId.set(pub.id, releaseIds);
		}

		// Lazy doc loading: fetch a pub's release docs once, on first render of that pub.
		const docByReleaseId = new Map<string, DocJson>();
		const docsLoadedForPub = new Set<string>();
		const ensureDocsForPub = async (pubId: string): Promise<void> => {
			if (docsLoadedForPub.has(pubId)) {
				return;
			}
			docsLoadedForPub.add(pubId);
			const releaseIds = releaseIdsByPubId.get(pubId) ?? [];
			const docIds = releaseIds
				.map((rid) => docIdByReleaseId.get(rid))
				.filter((d): d is string => Boolean(d));
			if (docIds.length === 0) {
				return;
			}
			const docs = await Doc.findAll({ where: { id: docIds } });
			const contentByDocId = new Map(docs.map((d) => [d.id, d.content]));
			for (const rid of releaseIds) {
				const docId = docIdByReleaseId.get(rid);
				const content = docId ? contentByDocId.get(docId) : undefined;
				if (content) {
					docByReleaseId.set(rid, content);
				}
			}
		};

		const communityInput: CommunityInput = {
			id: community.id,
			subdomain: community.subdomain,
			title: community.title,
			description: community.description,
			issn: community.issn,
			publishAs: community.publishAs,
			citeAs: community.citeAs,
		};

		const collectionInputs: CollectionInput[] = collections.map((c) => ({
			id: c.id,
			title: c.title,
			slug: c.slug,
			kind: c.kind,
			doi: c.doi,
			isPublic: c.isPublic,
			metadata: (c.metadata as Record<string, unknown> | null) ?? null,
		}));

		const pubInputs: PubInput[] = pubs.map((pub) => ({
			id: pub.id,
			slug: pub.slug,
			title: pub.title,
			description: pub.description,
			doi: pub.doi,
			createdAt: pub.createdAt,
			attributions: (pub.attributions ?? []).map((a) => ({
				id: a.id,
				name: a.name,
				affiliation: a.affiliation,
				orcid: a.orcid,
				isAuthor: a.isAuthor,
				order: a.order,
				roles: a.roles ?? null,
				user: a.user ? { fullName: a.user.fullName, orcid: a.user.orcid } : null,
			})),
			collectionPubs: (pub.collectionPubs ?? []).map((cp) => ({
				collectionId: cp.collectionId,
			})),
			releases: (pub.releases ?? []).map((r) => ({
				id: r.id,
				historyKey: r.historyKey,
				createdAt: r.createdAt,
				docId: r.docId,
			})),
			outboundEdges: (pub.outboundEdges ?? []).map((e) => ({
				id: e.id,
				relationType: e.relationType,
				pubIsParent: e.pubIsParent,
				targetPubId: e.targetPubId,
				externalPublication: e.externalPublication
					? {
							title: e.externalPublication.title,
							url: e.externalPublication.url,
							doi: e.externalPublication.doi,
						}
					: null,
			})),
			downloads: (pub.downloads as { url: string; type: string }[] | null) ?? null,
		}));

		const pubUpdatedAt: Record<string, Date> = {};
		for (const pub of pubs) {
			pubUpdatedAt[pub.id] = pub.updatedAt;
		}

		// Facet change signal. `fetchFacetsForScopeIds({ pub })` already resolved the full
		// community→collection→pub cascade for us (no extra query), so `facets.pub[pubId]` is the exact
		// resolved facet stack that feeds getReleaseHtml. Hashing that value gives cascade-correct
		// invalidation for free: a community facet edit changes every pub's resolved value; a collection
		// edit changes only that collection's pubs; a pub edit changes only that pub. It's value-based,
		// so a no-op facet edit that doesn't change the effective value won't force a needless re-render.
		const pubFacetsSignature: Record<string, string> = {};
		for (const pub of pubs) {
			pubFacetsSignature[pub.id] = computeFacetsSignature(facets.pub[pub.id]);
		}

		const renderReleaseHtml = async ({
			pub,
			release,
		}: {
			pub: PubInput;
			release: { id: string };
		}): Promise<string> => {
			await ensureDocsForPub(pub.id);
			const doc = docByReleaseId.get(release.id);
			if (!doc) {
				return '';
			}
			// The legacy renderer's facet/metadata types are broad; cast at this boundary only.
			const pubFacets = facets.pub[pub.id] as any;
			const metadata = {
				attributions: attributionsByPubId.get(pub.id) ?? [],
				licenseKind: pubFacets?.License?.value?.kind,
			} as any;
			return getReleaseHtml(pubFacets, doc, metadata);
		};

		const fetchAsset = async (url: string): Promise<Buffer> => {
			const normalized = getAssetUrlFromResizedUrl(url);
			const response = await fetch(normalized, { signal: AbortSignal.timeout(30_000) });
			if (!response.ok) {
				throw new Error(`Failed to download asset ${normalized}: ${response.status}`);
			}
			return Buffer.from(await response.arrayBuffer());
		};

		const options = {
			includeReleaseHtml: integration.includeReleaseHtml,
			includeAssets: integration.includeAssets,
			includePdfs: integration.includePdfs,
		};

		// Assets that failed to download are skipped (non-fatal); collect the warnings so the admin
		// sees them in the UI and logs instead of the push silently omitting content.
		const assetWarnings = new Set<string>();

		// Map ONE pub → records + the files those records reference (renders on demand).
		const mapPub = async (pub: PubInput) => {
			const filesByHash = new Map<string, UnderlayFile>();
			const addFile = (bytes: Buffer, contentType: string): string => {
				const hash = hashBytes(bytes);
				if (!filesByHash.has(hash)) {
					filesByHash.set(hash, { hash, contentType, bytes });
				}
				return hash;
			};
			const records = await mapPubRecords(pub, {
				community: communityInput,
				options,
				addFile,
				renderReleaseHtml,
				fetchAsset,
				onAssetWarning: (message) => assetWarnings.add(message),
			});
			return { records, files: [...filesByHash.values()] };
		};

		const cacheEntries = await getPushCacheEntries(integration.id);
		const incremental = await buildIncrementalPush({
			community: communityInput,
			collections: collectionInputs,
			pubs: pubInputs,
			pubUpdatedAt,
			pubFacetsSignature,
			options,
			cacheEntries,
			mapPub,
		});

		// Client-side no-op guard: identical content since the last push → skip entirely.
		if (
			integration.lastManifestHash &&
			integration.lastManifestHash === incremental.signature
		) {
			await recordPushResult(communityId, {
				status: 'noop',
				manifestHash: incremental.signature,
			});
			return {
				status: 'noop' as const,
				reason: 'No changes since last push',
				stats: incremental.stats,
			};
		}

		console.info(
			`[underlay] Mapped ${incremental.stats.totalPubs} pub(s): ${incremental.stats.cacheHits} cache hit(s), ${incremental.stats.cacheMisses} re-mapped. Negotiating…`,
		);

		await client.ensureCollection();
		const baseVersion = await client.getBaseVersion();
		const result = await client.push(
			incremental.payload,
			baseVersion,
			`PubPub sync for ${community.subdomain}`,
		);

		if (assetWarnings.size > 0) {
			console.warn(
				`[underlay] Push completed with ${assetWarnings.size} skipped asset(s):\n${[...assetWarnings].map((w) => `  - ${w}`).join('\n')}`,
			);
		}

		if (result.status === 'committed') {
			console.info(
				`[underlay] Committed version ${result.semver} (${result.recordCount} records, ${result.fileCount} files).`,
			);
			await recordPushResult(communityId, {
				status: 'success',
				semver: result.semver,
				manifestHash: incremental.signature,
				warning:
					assetWarnings.size > 0
						? `Completed with ${assetWarnings.size} skipped asset(s):\n${[...assetWarnings].join('\n')}`
						: null,
			});
			// Persist the cache only after a successful commit.
			await applyPushCache(
				integration.id,
				incremental.cacheUpserts,
				incremental.presentPubIds,
			);
		} else {
			await recordPushResult(communityId, {
				status: 'noop',
				manifestHash: incremental.signature,
			});
		}
		return { ...result, stats: incremental.stats, warnings: [...assetWarnings] };
	} catch (error) {
		const detail = formatUnderlayError(error);
		console.error(`[underlay] Push failed for community ${communityId}: ${detail}`);
		await recordPushResult(communityId, {
			status: 'error',
			error: detail,
		});
		throw error;
	}
};
