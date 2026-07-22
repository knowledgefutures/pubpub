import { canonicalize, hashBytes, hashRecord } from './hash';
import {
	type AssetCacheContext,
	type AssetWarning,
	buildManifest,
	type CollectionInput,
	type CommunityInput,
	computeSignatureFromParts,
	type JsonSchema,
	MAPPING_VERSION,
	type ManifestEntry,
	mapCommunityScopeRecords,
	type PubInput,
	type PushOptions,
	type UnderlayFile,
	type UnderlayPushPayload,
	type UnderlayRecord,
	underlaySchemas,
} from './mapping';

/**
 * Incremental push assembly. Builds the full manifest for a community's push while re-mapping (and
 * re-rendering) only the pubs whose content changed since the last successful push; unchanged pubs
 * contribute their cached record + file hashes to the manifest without any rendering or asset fetch.
 *
 * Correctness guarantee: even for a cache-hit pub, if the server unexpectedly asks for one of its
 * records or files (e.g. it was GC'd, or a prior push never fully landed), the returned payload's
 * `resolveRecordByHash` / `resolveFileByHash` lazily re-map that pub on demand and produce it. So a
 * cache hit never means "we can't fulfil a needed_records request".
 *
 * See planning/pubpub-underlay-integration.md §3c.
 */

/** Cached snapshot of one pub's last successful push (persisted as an UnderlayPushEntry row). */
export type CachedPubEntry = {
	pubId: string;
	recordHashes: Record<string, { type: string; hash: string }>;
	fileHashes: string[];
	latestReleaseHistoryKey: number | null;
	pubUpdatedAt: string | Date;
	optionsSignature: string;
	/** Hash of the pub's resolved facet cascade at cache time; a facet change flips it. */
	facetsSignature: string;
};

/** Maps one pub to its records + the files those records reference. Renders/fetches on demand. */
export type MapPubFn = (
	pub: PubInput,
) => Promise<{ records: UnderlayRecord[]; files: UnderlayFile[] }>;

export type IncrementalPushInput = {
	community: CommunityInput;
	collections: CollectionInput[];
	/** All pubs, hydrated cheaply (no docs): attributions, collectionPubs, edges, release metadata. */
	pubs: PubInput[];
	/** pubId → the pub's `updatedAt` (cheap change signal). */
	pubUpdatedAt: Record<string, string | Date>;
	/**
	 * pubId → hash of that pub's fully-resolved facet cascade. Facet edits at community/collection/pub
	 * scope change the resolved value (and thus this hash) without bumping `updatedAt` or adding a
	 * release, so this is the signal that invalidates a pub whose rendered content changed via facets.
	 */
	pubFacetsSignature?: Record<string, string>;
	options: PushOptions;
	/** Version metadata (e.g. `{ readme }`) pushed as Underlay version metadata; folded into the
	 * signature so a metadata-only edit (readme) isn't skipped by the no-op guard. */
	metadata?: Record<string, unknown> | null;
	cacheEntries: CachedPubEntry[];
	mapPub: MapPubFn;
	/** Fetches asset bytes for community/collection/author-scope images (avatars, logos, hero). */
	fetchAsset?: (url: string) => Promise<Buffer>;
	/** Collects non-fatal asset-download failures (community-scope). */
	onAssetWarning?: (warning: AssetWarning) => void;
	/**
	 * Shared immutable-asset cache. When set, scope images resolve from it without downloading; any
	 * cached file the server later needs is fetched lazily by hash via `resolveFileByHash`.
	 */
	assetCache?: AssetCacheContext;
};

export type IncrementalPushResult = {
	payload: UnderlayPushPayload;
	signature: string;
	/** Cache rows to write (only the freshly-mapped/changed pubs; cache hits need no write). */
	cacheUpserts: CachedPubEntry[];
	/** Every pub id present this push — stale cache rows (pubs not in this set) should be deleted. */
	presentPubIds: string[];
	stats: { totalPubs: number; cacheHits: number; cacheMisses: number };
};

const toIso = (value: string | Date): string =>
	typeof value === 'string' ? new Date(value).toISOString() : value.toISOString();

const latestHistoryKeyOf = (pub: PubInput): number | null => {
	const keys = (pub.releases ?? []).map((r) => r.historyKey);
	return keys.length > 0 ? Math.max(...keys) : null;
};

/**
 * Deterministic signature of a pub's fully-resolved facet cascade. The worker passes
 * `fetchFacetsForScopeIds({ pub })`'s resolved value (the community→collection→pub cascade that feeds
 * getReleaseHtml), so this is cascade-correct by construction: a facet edit at any scope changes the
 * resolved value of exactly the pubs it affects, and thus their signatures. Canonicalized, so key
 * order is irrelevant; value-based, so a facet edit that doesn't change the effective value is a no-op.
 */
export const computeFacetsSignature = (resolvedFacets: unknown): string =>
	hashBytes(Buffer.from(JSON.stringify(canonicalize(resolvedFacets ?? {}))));

/**
 * Deterministic signature of the push-relevant options AND the mapping shape version. A change to
 * either invalidates every cache entry — the `MAPPING_VERSION` term is what forces a one-time
 * re-map of every pub when the emitted record shape changes in code (otherwise cache-hit pubs would
 * re-emit stale hashes for the OLD shape). `mappingVersion` is injectable only so tests can prove a
 * bump changes the signature; production always uses the module constant.
 */
export const optionsSignature = (
	options: PushOptions,
	mappingVersion: string = MAPPING_VERSION,
): string =>
	hashBytes(
		Buffer.from(
			JSON.stringify({
				mappingVersion,
				includeReleaseHtml: options.includeReleaseHtml,
				includeAssets: options.includeAssets,
				exportFormats: [...options.exportFormats].sort(),
			}),
		),
	);

/**
 * A pub is unchanged iff its updatedAt, latest release, the options signature, AND its resolved
 * facet signature all still match. The facet check catches facet edits (license, citation style,
 * header theme, …) at any scope in the pub's cascade — these change rendered HTML without touching
 * `updatedAt` or adding a release, so without it a scheduled push would serve stale content.
 */
export const isCacheHit = (
	pub: PubInput,
	pubUpdatedAt: string | Date | undefined,
	entry: CachedPubEntry | undefined,
	currentOptionsSignature: string,
	currentFacetsSignature: string | undefined,
): boolean => {
	if (!entry || pubUpdatedAt === undefined) {
		return false;
	}
	return (
		entry.optionsSignature === currentOptionsSignature &&
		entry.facetsSignature === (currentFacetsSignature ?? '') &&
		entry.latestReleaseHistoryKey === latestHistoryKeyOf(pub) &&
		toIso(entry.pubUpdatedAt) === toIso(pubUpdatedAt)
	);
};

const recordHashesFrom = (
	records: UnderlayRecord[],
): Record<string, { type: string; hash: string }> => {
	const out: Record<string, { type: string; hash: string }> = {};
	for (const record of records) {
		out[record.id] = { type: record.type, hash: hashRecord(record).hash };
	}
	return out;
};

export const buildIncrementalPush = async (
	input: IncrementalPushInput,
): Promise<IncrementalPushResult> => {
	const {
		community,
		collections,
		pubs,
		pubUpdatedAt,
		pubFacetsSignature = {},
		options,
		metadata,
		cacheEntries,
		mapPub,
		fetchAsset,
		onAssetWarning,
		assetCache,
	} = input;

	const optionsSig = optionsSignature(options);
	const entryByPubId = new Map(cacheEntries.map((e) => [e.pubId, e]));
	const pubById = new Map(pubs.map((p) => [p.id, p]));

	// Owner index: every cached record/file hash → the pub that produced it. Drives lazy re-hydration.
	const pubIdByHash = new Map<string, string>();
	for (const entry of cacheEntries) {
		for (const { hash } of Object.values(entry.recordHashes)) {
			pubIdByHash.set(hash, entry.pubId);
		}
		for (const hash of entry.fileHashes) {
			pubIdByHash.set(hash, entry.pubId);
		}
	}

	const manifest: ManifestEntry[] = [];
	const freshRecords: UnderlayRecord[] = [];
	const freshFilesByHash = new Map<string, UnderlayFile>();
	const allFileHashes = new Set<string>();
	const cacheUpserts: CachedPubEntry[] = [];
	let cacheHits = 0;
	let cacheMisses = 0;

	// Community-scope records (Community, Collections, Users) are always recomputed — cheap, and
	// their identity depends on cross-pub dedup. Their localized branding/avatar files (if any) are
	// added to the fresh file set + manifest file hashes; they are always sent in full (never cached
	// per-pub), so no lazy-rehydration path is needed for them.
	const addScopeFile = (bytes: Buffer, contentType: string, fileName?: string): string => {
		const hash = hashBytes(bytes);
		if (!freshFilesByHash.has(hash)) {
			freshFilesByHash.set(hash, { hash, contentType, fileName, bytes });
		}
		allFileHashes.add(hash);
		return hash;
	};
	// A scope image that resolved from the asset cache has no bytes here; still declare its hash so the
	// signature (and the version's referenced files) is identical to a freshly-downloaded push. The
	// bytes are produced on demand by resolveFileByHash below if the server turns out to need them.
	const registerCachedScopeHash = (hash: string) => {
		allFileHashes.add(hash);
	};
	const scopeRecords = await mapCommunityScopeRecords(community, collections, pubs, {
		addFile: addScopeFile,
		fetchAsset,
		onAssetWarning,
		options,
		assetCache,
		registerCachedHash: registerCachedScopeHash,
	});
	freshRecords.push(...scopeRecords);
	manifest.push(...buildManifest(scopeRecords));

	for (const pub of pubs) {
		const entry = entryByPubId.get(pub.id);
		if (
			isCacheHit(pub, pubUpdatedAt[pub.id], entry, optionsSig, pubFacetsSignature[pub.id]) &&
			entry
		) {
			cacheHits += 1;
			for (const [recordId, { type, hash }] of Object.entries(entry.recordHashes)) {
				manifest.push({ id: recordId, type, hash });
			}
			for (const hash of entry.fileHashes) {
				allFileHashes.add(hash);
			}
			// The row is already current — no write needed; retention keeps it (pubId is present).
			continue;
		}

		cacheMisses += 1;
		// biome-ignore lint/performance/noAwaitInLoops: pubs mapped sequentially to bound memory
		const { records, files } = await mapPub(pub);
		freshRecords.push(...records);
		manifest.push(...buildManifest(records));
		for (const file of files) {
			if (!freshFilesByHash.has(file.hash)) {
				freshFilesByHash.set(file.hash, file);
			}
			allFileHashes.add(file.hash);
			pubIdByHash.set(file.hash, pub.id);
		}
		for (const record of records) {
			pubIdByHash.set(hashRecord(record).hash, pub.id);
		}
		cacheUpserts.push({
			pubId: pub.id,
			recordHashes: recordHashesFrom(records),
			fileHashes: files.map((f) => f.hash),
			latestReleaseHistoryKey: latestHistoryKeyOf(pub),
			pubUpdatedAt: toIso(pubUpdatedAt[pub.id] ?? new Date(0).toISOString()),
			optionsSignature: optionsSig,
			facetsSignature: pubFacetsSignature[pub.id] ?? '',
		});
	}

	// Stable ordering (by type, then id) for a tidy manifest; the signature is order-independent.
	manifest.sort((a, b) =>
		a.type === b.type ? a.id.localeCompare(b.id) : a.type.localeCompare(b.type),
	);

	// Schemas for the types actually present anywhere in the manifest.
	const presentTypes = new Set(manifest.map((m) => m.type));
	const schemas: Record<string, JsonSchema> = {};
	for (const type of Object.keys(underlaySchemas)) {
		if (presentTypes.has(type)) {
			schemas[type] = underlaySchemas[type];
		}
	}

	// ── Lazy re-hydration: produce a needed record/file for a cache-hit pub on demand. ──────────
	const hydratedByPubId = new Map<
		string,
		{ records: Map<string, UnderlayRecord>; files: Map<string, UnderlayFile> }
	>();
	const hydratePub = async (pubId: string) => {
		const cached = hydratedByPubId.get(pubId);
		if (cached) {
			return cached;
		}
		const pub = pubById.get(pubId);
		if (!pub) {
			const empty = {
				records: new Map<string, UnderlayRecord>(),
				files: new Map<string, UnderlayFile>(),
			};
			hydratedByPubId.set(pubId, empty);
			return empty;
		}
		const { records, files } = await mapPub(pub);
		const recordMap = new Map<string, UnderlayRecord>();
		for (const record of records) {
			recordMap.set(hashRecord(record).hash, record);
		}
		const fileMap = new Map<string, UnderlayFile>();
		for (const file of files) {
			fileMap.set(file.hash, file);
		}
		const result = { records: recordMap, files: fileMap };
		hydratedByPubId.set(pubId, result);
		return result;
	};

	const resolveRecordByHash = async (hash: string): Promise<UnderlayRecord | null> => {
		const pubId = pubIdByHash.get(hash);
		if (!pubId) {
			return null;
		}
		return (await hydratePub(pubId)).records.get(hash) ?? null;
	};
	const resolveFileByHash = async (hash: string): Promise<UnderlayFile | null> => {
		// A cache-resolved file (e.g. a scope image) has no bytes in memory — fetch them from the
		// immutable source URL on demand, and verify the bytes still hash to what we declared (a
		// mismatch means the URL was not immutable / the cache is poisoned; refuse to upload it wrong).
		const cached = assetCache?.byHash.get(hash);
		if (cached && fetchAsset) {
			const bytes = await fetchAsset(cached.url);
			const got = hashBytes(bytes);
			if (got !== hash) {
				throw new Error(
					`Underlay asset cache mismatch: ${cached.url} hashed to ${got} but the push declared ${hash}. ` +
						'The asset URL was expected to be immutable; refusing to upload bytes under the wrong hash.',
				);
			}
			return {
				hash,
				bytes,
				contentType: cached.mimeType ?? 'application/octet-stream',
				fileName: cached.fileName,
			};
		}
		const pubId = pubIdByHash.get(hash);
		if (!pubId) {
			return null;
		}
		return (await hydratePub(pubId)).files.get(hash) ?? null;
	};

	const payload: UnderlayPushPayload = {
		records: freshRecords,
		files: [...freshFilesByHash.values()].sort((a, b) => a.hash.localeCompare(b.hash)),
		schemas,
		manifest,
		resolveRecordByHash,
		resolveFileByHash,
	};

	return {
		payload,
		signature: computeSignatureFromParts(manifest, [...allFileHashes], schemas, metadata),
		cacheUpserts,
		presentPubIds: pubs.map((p) => p.id),
		stats: { totalPubs: pubs.length, cacheHits, cacheMisses },
	};
};
