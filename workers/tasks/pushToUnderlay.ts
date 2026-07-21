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
import { licenseDetailsByKind } from 'utils/licenses';

import { formatUnderlayError, UnderlayClient } from '../../server/underlay/client';
import { hashBytes } from '../../server/underlay/hash';
import { buildIncrementalPush, computeFacetsSignature } from '../../server/underlay/incremental';
import {
	type AssetCacheContext,
	type AssetWarning,
	type CollectionInput,
	type CommunityInput,
	type Json,
	mapPubRecords,
	type PubInput,
	type UnderlayFile,
} from '../../server/underlay/mapping';
import {
	getCachedAssetHashes,
	saveCachedAssetHashes,
} from '../../server/underlayAssetCache/queries';
import {
	getUnderlayIntegrationWithKey,
	recordPushResult,
} from '../../server/underlayIntegration/queries';
import { applyPushCache, getPushCacheEntries } from '../../server/underlayPushEntry/queries';
import { beginPushLog, finishPushLog } from '../../server/underlayPushLog/queries';
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

	// Push-history entry. The manual path pre-creates a `running` log at enqueue time and this adopts
	// it; the scheduled path has none yet, so beginPushLog creates one. Finalized in every branch.
	const pushLog = await beginPushLog(communityId, input.workerTaskId ?? null);
	const logId = pushLog?.id ?? null;

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
			// Canonical identity + branding (images localized to files downstream; layout toggles excluded).
			avatar: community.avatar,
			favicon: community.favicon,
			headerLogo: community.headerLogo,
			heroLogo: community.heroLogo,
			heroImage: community.heroImage,
			heroBackgroundImage: community.heroBackgroundImage,
			accentColorLight: community.accentColorLight,
			accentColorDark: community.accentColorDark,
			heroBackgroundColor: community.heroBackgroundColor,
			heroTitle: community.heroTitle,
			heroText: community.heroText,
			website: community.website,
			facebook: community.facebook,
			twitter: community.twitter,
			instagram: community.instagram,
			mastodon: community.mastodon,
			linkedin: community.linkedin,
			bluesky: community.bluesky,
			github: community.github,
			email: community.email,
		};

		const collectionInputs: CollectionInput[] = collections.map((c) => ({
			id: c.id,
			title: c.title,
			slug: c.slug,
			kind: c.kind,
			doi: c.doi,
			isPublic: c.isPublic,
			avatar: c.avatar,
			metadata: (c.metadata as Record<string, unknown> | null) ?? null,
		}));

		// Map collectionId → kind so a pub's scholarly `kind` can be derived from its memberships
		// without hydrating each collection on the pub. Best-effort (see deriveKind below).
		const collectionKindById = new Map(collections.map((c) => [c.id, c.kind]));
		const deriveKind = (pub: Pub): string | undefined => {
			const kinds = (pub.collectionPubs ?? []).map((cp) =>
				collectionKindById.get(cp.collectionId),
			);
			if (kinds.includes('book')) {
				return 'BookChapter';
			}
			if (kinds.includes('conference')) {
				return 'ConferenceProceeding';
			}
			if (kinds.includes('issue') || kinds.includes('tag')) {
				return 'JournalArticle';
			}
			return undefined;
		};

		const pubInputs: PubInput[] = pubs.map((pub) => {
			// License comes from the already-resolved facet cascade (no extra query); enrich the raw
			// kind with the SPDX id + canonical URI via the shared license table.
			const pubFacets = facets.pub[pub.id] as
				| { License?: { value?: { kind?: string } } }
				| undefined;
			const licenseKind = pubFacets?.License?.value?.kind;
			const licenseDetails = licenseKind
				? (
						licenseDetailsByKind as Record<
							string,
							{ spdxIdentifier?: string; link?: string }
						>
					)[licenseKind]
				: undefined;
			return {
				id: pub.id,
				slug: pub.slug,
				title: pub.title,
				htmlTitle: pub.htmlTitle,
				description: pub.description,
				htmlDescription: pub.htmlDescription,
				avatar: pub.avatar,
				metadata: (pub.metadata as Record<string, Json> | null) ?? null,
				labels: pub.labels ?? null,
				doi: pub.doi,
				kind: deriveKind(pub),
				license: licenseKind ?? null,
				licenseSpdx: licenseDetails?.spdxIdentifier ?? null,
				licenseUri: licenseDetails?.link ?? null,
				createdAt: pub.createdAt,
				customPublishedAt: pub.customPublishedAt,
				attributions: (pub.attributions ?? []).map((a) => ({
					id: a.id,
					userId: a.userId,
					name: a.name,
					avatar: a.avatar,
					title: a.title,
					affiliation: a.affiliation,
					orcid: a.orcid,
					isAuthor: a.isAuthor,
					order: a.order,
					roles: a.roles ?? null,
					user: a.user
						? {
								id: a.user.id,
								fullName: a.user.fullName,
								orcid: a.user.orcid,
								avatar: a.user.avatar,
								slug: a.user.slug,
								title: a.user.title,
							}
						: null,
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
			};
		});

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

		// Assets that failed to download are skipped (non-fatal); collect structured warnings so the
		// admin sees them (in the push history + logs) instead of the push silently omitting content
		// — or, worse, the whole push failing. Deduped by pub + URL.
		const assetWarnings = new Map<string, AssetWarning>();
		const collectAssetWarning = (warning: AssetWarning) =>
			assetWarnings.set(`${warning.pubId ?? 'community'}|${warning.assetUrl}`, warning);

		// Map ONE pub → records + the files those records reference (renders on demand).
		const mapPub = async (pub: PubInput) => {
			const filesByHash = new Map<string, UnderlayFile>();
			const addFile = (bytes: Buffer, contentType: string, fileName?: string): string => {
				const hash = hashBytes(bytes);
				if (!filesByHash.has(hash)) {
					filesByHash.set(hash, { hash, contentType, fileName, bytes });
				}
				return hash;
			};
			const records = await mapPubRecords(pub, {
				community: communityInput,
				options,
				addFile,
				renderReleaseHtml,
				fetchAsset,
				onAssetWarning: collectAssetWarning,
			});
			return { records, files: [...filesByHash.values()] };
		};

		// Immutable-asset cache: the community/collection/author branding images are recomputed on every
		// push (scope records are never cached per-pub), so without this they'd be re-downloaded each
		// time. `assets.pubpub.org` URLs are content-addressed and permanent, so a url→hash mapping is
		// safe to reuse forever. Preload the known hashes for this push's scope image URLs in one query;
		// the localizer then references them without downloading (bytes are fetched lazily only if the
		// Underlay server actually needs them). Newly-fetched URLs are persisted after a successful commit.
		const scopeImageUrls = new Set<string>();
		const addScopeUrl = (url?: string | null) => {
			if (url && url.startsWith('https://assets.pubpub.org/')) {
				scopeImageUrls.add(url);
			}
		};
		addScopeUrl(communityInput.avatar);
		addScopeUrl(communityInput.favicon);
		addScopeUrl(communityInput.headerLogo);
		addScopeUrl(communityInput.heroLogo);
		addScopeUrl(communityInput.heroImage);
		addScopeUrl(communityInput.heroBackgroundImage);
		for (const collection of collectionInputs) {
			addScopeUrl(collection.avatar);
		}
		for (const pub of pubInputs) {
			for (const attribution of pub.attributions ?? []) {
				addScopeUrl(attribution.avatar);
			}
		}
		const preloaded = await getCachedAssetHashes([...scopeImageUrls]);
		const assetCache: AssetCacheContext = {
			preloaded,
			learned: new Map(),
			byHash: new Map(),
		};
		// Seed the reverse map so a cached scope file the server GC'd can be re-fetched by hash even if
		// this push never re-localized its URL.
		for (const [url, asset] of preloaded) {
			assetCache.byHash.set(asset.hash, {
				url,
				fileName: asset.fileName,
				mimeType: asset.mimeType,
			});
		}

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
			fetchAsset,
			onAssetWarning: collectAssetWarning,
			assetCache,
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
			if (logId) {
				await finishPushLog(logId, {
					status: 'noop',
					message: 'No changes since last push',
				});
			}
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
			integration.readme ? { readme: integration.readme } : undefined,
		);

		const warnings: AssetWarning[] = [...assetWarnings.values()];
		if (warnings.length > 0) {
			console.warn(
				`[underlay] Push completed with ${warnings.length} skipped asset(s):\n${warnings
					.map((w) => `  - ${w.assetUrl} (pub ${w.pubId}): ${w.reason}`)
					.join('\n')}`,
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
					warnings.length > 0
						? `Completed with ${warnings.length} skipped asset(s).`
						: null,
			});
			if (logId) {
				await finishPushLog(logId, {
					status: 'success',
					semver: result.semver,
					recordCount: result.recordCount,
					fileCount: result.fileCount,
					message: `Pushed version ${result.semver}`,
					warnings,
				});
			}
			// Persist the cache only after a successful commit.
			await applyPushCache(
				integration.id,
				incremental.cacheUpserts,
				incremental.presentPubIds,
			);
			// Record any newly-fetched immutable asset URLs so future pushes skip the download.
			if (assetCache.learned.size > 0) {
				await saveCachedAssetHashes(
					[...assetCache.learned].map(([url, asset]) => ({
						url,
						hash: asset.hash,
						mimeType: asset.mimeType,
						fileName: asset.fileName,
					})),
				);
			}
		} else {
			await recordPushResult(communityId, {
				status: 'noop',
				manifestHash: incremental.signature,
			});
			if (logId) {
				await finishPushLog(logId, { status: 'noop', warnings });
			}
		}
		return { ...result, stats: incremental.stats, warnings };
	} catch (error) {
		const detail = formatUnderlayError(error);
		console.error(`[underlay] Push failed for community ${communityId}: ${detail}`);
		await recordPushResult(communityId, {
			status: 'error',
			error: detail,
		});
		if (logId) {
			await finishPushLog(logId, { status: 'error', error: detail });
		}
		throw error;
	}
};
