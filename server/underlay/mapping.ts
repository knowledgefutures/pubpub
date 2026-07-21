import { hashBytes, hashRecord } from './hash';

/**
 * Maps PubPub entities to flat, content-addressed Underlay records + per-type JSON Schemas.
 *
 * Design constraints (see planning/pubpub-underlay-integration.md §2):
 * - Records are flat `{ id, type, data }`. `id` is a stable PubPub primary key.
 * - `data` contains NO volatile fields (no export-time timestamps) so that unchanged content
 *   produces an unchanged hash — this is what makes re-pushes a no-op.
 * - Heavy/nested content (rendered release HTML, binary assets) becomes a file reference
 *   `{"$file":"sha256:<hex>"}`; the bytes are uploaded separately and deduplicated by hash.
 * - Emitted `data` keys must exactly match the declared schema properties (Underlay rejects
 *   fields not present in the schema).
 *
 * The module is pure: HTML rendering and asset fetching are injected so it can be unit-tested
 * without a database, React, or the network.
 */

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
export type JsonSchema = Record<string, unknown>;

export type UnderlayRecord = {
	id: string;
	type: string;
	data: Record<string, Json>;
	/** Owner-only visibility. Not part of the record hash. */
	private?: boolean;
};

export type UnderlayFile = {
	/** Bare lowercase-hex SHA-256 (no `sha256:` prefix). */
	hash: string;
	contentType: string;
	bytes: Buffer;
};

export type ManifestEntry = { id: string; type: string; hash: string; private?: boolean };

export type UnderlayPushPayload = {
	records: UnderlayRecord[];
	schemas: Record<string, JsonSchema>;
	/** Deduplicated by hash. */
	files: UnderlayFile[];
	/**
	 * Precomputed full manifest. Set by the incremental push path, where the manifest spans both
	 * freshly-mapped records and records reused from the push cache (whose data is not in `records`).
	 * When omitted, the client derives the manifest from `records`.
	 */
	manifest?: ManifestEntry[];
	/**
	 * Lazy fallback for the incremental path: produce a record whose hash the server asked for but
	 * which isn't in `records` (e.g. a cache-hit pub the server unexpectedly needs re-sent). Returns
	 * null if the hash can't be resolved.
	 */
	resolveRecordByHash?: (hash: string) => Promise<UnderlayRecord | null>;
	/** Lazy fallback: produce file bytes the server asked for but which aren't in `files`. */
	resolveFileByHash?: (hash: string) => Promise<UnderlayFile | null>;
};

/** Injected context for mapping a single pub's records (shared by the full + incremental paths). */
export type PubMapContext = {
	community: CommunityInput;
	options: PushOptions;
	/** Registers file bytes and returns the bare hex hash (deduping by hash). */
	addFile: (bytes: Buffer, contentType: string) => string;
	renderReleaseHtml: (ctx: { pub: PubInput; release: ReleaseInput }) => Promise<string>;
	fetchAsset?: (url: string) => Promise<Buffer>;
	/**
	 * Called when an asset/PDF fails to download and is skipped (non-fatal). Lets the caller
	 * collect the warnings and surface them to the admin instead of failing the whole push.
	 */
	onAssetWarning?: (message: string) => void;
};

export type PushOptions = {
	includeReleaseHtml: boolean;
	includeAssets: boolean;
	includePdfs: boolean;
};

// ── Structural inputs (a subset of the hydrated PubPub JSON we actually read) ────────────────

export type CommunityInput = {
	id: string;
	subdomain: string;
	title: string;
	description?: string | null;
	issn?: string | null;
	publishAs?: string | null;
	citeAs?: string | null;
};

export type CollectionInput = {
	id: string;
	title: string;
	slug?: string | null;
	kind?: string | null;
	doi?: string | null;
	isPublic?: boolean | null;
	metadata?: Record<string, unknown> | null;
};

export type AttributionInput = {
	id: string;
	name?: string | null;
	affiliation?: string | null;
	orcid?: string | null;
	isAuthor?: boolean | null;
	order?: number | null;
	roles?: string[] | null;
	user?: { fullName?: string | null; orcid?: string | null } | null;
};

export type ReleaseInput = {
	id: string;
	historyKey: number;
	createdAt: string | Date;
	docId?: string | null;
	/** Optional precomputed word count; included only when provided. */
	wordCount?: number | null;
};

export type PubEdgeInput = {
	id: string;
	relationType: string;
	pubIsParent?: boolean | null;
	targetPubId?: string | null;
	externalPublication?: {
		title?: string | null;
		url?: string | null;
		doi?: string | null;
	} | null;
};

export type PubInput = {
	id: string;
	slug: string;
	title: string;
	description?: string | null;
	doi?: string | null;
	createdAt: string | Date;
	attributions?: AttributionInput[] | null;
	collectionPubs?: { collectionId: string }[] | null;
	releases?: ReleaseInput[] | null;
	outboundEdges?: PubEdgeInput[] | null;
	/** Formatted-download PDFs recorded on the pub (used when includePdfs is set). */
	downloads?: { url: string; type: string }[] | null;
};

const FILE_PREFIX = 'sha256:';
const fileRef = (hash: string): Record<string, Json> => ({ $file: `${FILE_PREFIX}${hash}` });

const toIso = (value: string | Date): string =>
	typeof value === 'string' ? new Date(value).toISOString() : value.toISOString();

const guessContentType = (url: string): string => {
	let ext: string | undefined;
	try {
		ext = new URL(url).pathname.split('.').pop()?.toLowerCase();
	} catch {
		return 'application/octet-stream';
	}
	switch (ext) {
		case 'png':
			return 'image/png';
		case 'jpg':
		case 'jpeg':
			return 'image/jpeg';
		case 'gif':
			return 'image/gif';
		case 'svg':
			return 'image/svg+xml';
		case 'webp':
			return 'image/webp';
		case 'pdf':
			return 'application/pdf';
		default:
			return 'application/octet-stream';
	}
};

/**
 * Regex matching asset URLs in rendered HTML, mirroring the community-export scraper.
 * Captures URLs from assets.pubpub.org (including Fastly IO query params).
 */
export const HTML_ASSET_URL_PATTERN =
	/(?:src|href|url\()=?"(https:\/\/assets\.pubpub\.org\/[^"?]+(?:\?[^"]*)?)"?/g;

export const extractAssetUrls = (html: string): string[] => {
	const urls = new Set<string>();
	const pattern = new RegExp(HTML_ASSET_URL_PATTERN.source, 'g');
	let match: RegExpExecArray | null;
	// biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop
	while ((match = pattern.exec(html)) !== null) {
		urls.add(match[1]);
	}
	return [...urls].sort();
};

// ── Per-type JSON Schemas. Property sets MUST match the emitted `data` exactly. ──────────────

const fileRefSchema = {
	type: 'object',
	properties: { $file: { type: 'string' } },
	required: ['$file'],
};

export const underlaySchemas: Record<string, JsonSchema> = {
	Community: {
		type: 'object',
		properties: {
			subdomain: { type: 'string' },
			title: { type: 'string' },
			description: { type: 'string' },
			issn: { type: 'string' },
			publishAs: { type: 'string' },
			citeAs: { type: 'string' },
		},
	},
	Collection: {
		type: 'object',
		properties: {
			title: { type: 'string' },
			slug: { type: 'string' },
			kind: { type: 'string' },
			doi: { type: 'string' },
			isPublic: { type: 'boolean' },
			communityId: { type: 'string', 'x-ref-type': 'Community' },
		},
	},
	Contributor: {
		type: 'object',
		properties: {
			name: { type: 'string' },
			orcid: { type: 'string' },
			affiliation: { type: 'string' },
			isAuthor: { type: 'boolean' },
			roles: { type: 'array', items: { type: 'string' } },
		},
	},
	Pub: {
		type: 'object',
		properties: {
			title: { type: 'string' },
			slug: { type: 'string' },
			description: { type: 'string' },
			doi: { type: 'string' },
			createdAt: { type: 'string', format: 'date-time' },
			communityId: { type: 'string', 'x-ref-type': 'Community' },
			collectionIds: { type: 'array', items: { type: 'string', 'x-ref-type': 'Collection' } },
			contributorIds: {
				type: 'array',
				items: { type: 'string', 'x-ref-type': 'Contributor' },
			},
			latestReleaseId: { type: 'string', 'x-ref-type': 'Release' },
		},
	},
	Release: {
		type: 'object',
		properties: {
			pubId: { type: 'string', 'x-ref-type': 'Pub' },
			historyKey: { type: 'number' },
			createdAt: { type: 'string', format: 'date-time' },
			wordCount: { type: 'number' },
			contentFile: fileRefSchema,
			assetHashes: { type: 'array', items: { type: 'string' } },
			pdfFile: fileRefSchema,
		},
	},
	Edge: {
		type: 'object',
		properties: {
			relationType: { type: 'string' },
			pubIsParent: { type: 'boolean' },
			sourcePubId: { type: 'string', 'x-ref-type': 'Pub' },
			targetPubId: { type: 'string', 'x-ref-type': 'Pub' },
			externalUrl: { type: 'string' },
			externalDoi: { type: 'string' },
			externalTitle: { type: 'string' },
		},
	},
};

/** Drop null/undefined so optional fields never appear as `null` in the hashed record. */
const compact = (data: Record<string, Json | null | undefined>): Record<string, Json> => {
	const out: Record<string, Json> = {};
	for (const [key, value] of Object.entries(data)) {
		if (value !== null && value !== undefined) {
			out[key] = value;
		}
	}
	return out;
};

const mapCommunity = (community: CommunityInput): UnderlayRecord => ({
	id: community.id,
	type: 'Community',
	data: compact({
		subdomain: community.subdomain,
		title: community.title,
		description: community.description ?? undefined,
		issn: community.issn ?? undefined,
		publishAs: community.publishAs ?? undefined,
		citeAs: community.citeAs ?? undefined,
	}),
});

const mapCollection = (collection: CollectionInput, communityId: string): UnderlayRecord => ({
	id: collection.id,
	type: 'Collection',
	data: compact({
		title: collection.title,
		slug: collection.slug ?? undefined,
		kind: collection.kind ?? undefined,
		doi: collection.doi ?? undefined,
		isPublic: collection.isPublic ?? undefined,
		communityId,
	}),
});

const mapContributor = (attribution: AttributionInput): UnderlayRecord => ({
	id: attribution.id,
	type: 'Contributor',
	data: compact({
		name: attribution.user?.fullName ?? attribution.name ?? undefined,
		orcid: attribution.user?.orcid ?? attribution.orcid ?? undefined,
		affiliation: attribution.affiliation ?? undefined,
		isAuthor: attribution.isAuthor ?? undefined,
		roles:
			attribution.roles && attribution.roles.length > 0 ? [...attribution.roles] : undefined,
	}),
});

const mapEdge = (edge: PubEdgeInput, sourcePubId: string): UnderlayRecord => ({
	id: edge.id,
	type: 'Edge',
	data: compact({
		relationType: edge.relationType,
		pubIsParent: edge.pubIsParent ?? undefined,
		sourcePubId,
		targetPubId: edge.targetPubId ?? undefined,
		externalUrl: edge.externalPublication?.url ?? undefined,
		externalDoi: edge.externalPublication?.doi ?? undefined,
		externalTitle: edge.externalPublication?.title ?? undefined,
	}),
});

/**
 * Map the cheap, community-scoped records: the Community, every Collection, and the deduplicated
 * Contributors across all pubs. These never require rendering, so they are always recomputed (never
 * cached) on an incremental push.
 */
export const mapCommunityScopeRecords = (
	community: CommunityInput,
	collections: CollectionInput[],
	pubs: PubInput[],
): UnderlayRecord[] => {
	const records: UnderlayRecord[] = [mapCommunity(community)];
	for (const collection of collections) {
		records.push(mapCollection(collection, community.id));
	}
	const seen = new Set<string>();
	for (const pub of pubs) {
		const attributions = (pub.attributions ?? [])
			.slice()
			.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
		for (const attribution of attributions) {
			if (!seen.has(attribution.id)) {
				seen.add(attribution.id);
				records.push(mapContributor(attribution));
			}
		}
	}
	return records;
};

/**
 * Map a SINGLE pub to its records: the Pub record, one Release record per release (with rendered
 * content + assets as file references), and its outbound Edge records. Contributors are handled by
 * the caller because they are deduplicated across pubs.
 *
 * This is the unit of the incremental push cache: a pub's cache entry stores the hashes of exactly
 * these records. Rendering (the expensive part) happens only here, so skipping it for unchanged pubs
 * is what makes incremental pushes cheap.
 */
export const mapPubRecords = async (
	pub: PubInput,
	ctx: PubMapContext,
): Promise<UnderlayRecord[]> => {
	const { community, options, addFile, renderReleaseHtml, fetchAsset, onAssetWarning } = ctx;
	const warnAsset = (url: string, error: unknown) => {
		const reason = error instanceof Error ? error.message : String(error);
		const message = `Skipped asset ${url} for pub "${pub.slug}": ${reason}`;
		console.error(`[underlay] ${message}`);
		onAssetWarning?.(message);
	};
	const out: UnderlayRecord[] = [];

	const attributions = (pub.attributions ?? [])
		.slice()
		.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
	const releases = (pub.releases ?? []).slice().sort((a, b) => a.historyKey - b.historyKey);
	const latestRelease = releases[releases.length - 1];

	out.push({
		id: pub.id,
		type: 'Pub',
		data: compact({
			title: pub.title,
			slug: pub.slug,
			description: pub.description ?? undefined,
			doi: pub.doi ?? undefined,
			createdAt: toIso(pub.createdAt),
			communityId: community.id,
			collectionIds: (pub.collectionPubs ?? []).map((cp) => cp.collectionId).sort(),
			contributorIds: attributions.map((a) => a.id),
			latestReleaseId: latestRelease?.id,
		}),
	});

	// One Underlay Release record per PubPub release (full, lossless history).
	for (const release of releases) {
		const releaseData: Record<string, Json | null | undefined> = {
			pubId: pub.id,
			historyKey: release.historyKey,
			createdAt: toIso(release.createdAt),
			wordCount: release.wordCount ?? undefined,
		};

		if (options.includeReleaseHtml) {
			// biome-ignore lint/performance/noAwaitInLoops: releases rendered sequentially to bound memory
			const html = await renderReleaseHtml({ pub, release });
			const htmlHash = addFile(Buffer.from(html, 'utf8'), 'text/html; charset=utf-8');
			releaseData.contentFile = fileRef(htmlHash);

			if (options.includeAssets && fetchAsset) {
				const assetUrls = extractAssetUrls(html);
				const assetHashes: string[] = [];
				for (const url of assetUrls) {
					try {
						// biome-ignore lint/performance/noAwaitInLoops: sequential to bound memory
						const bytes = await fetchAsset(url);
						assetHashes.push(addFile(bytes, guessContentType(url)));
					} catch (e) {
						warnAsset(url, e);
					}
				}
				if (assetHashes.length > 0) {
					releaseData.assetHashes = assetHashes.sort();
				}
			}
		}

		out.push({ id: release.id, type: 'Release', data: compact(releaseData) });
	}

	if (options.includePdfs) {
		const pdf = (pub.downloads ?? []).find((d) => d.type === 'formatted');
		if (pdf && fetchAsset && latestRelease) {
			try {
				const bytes = await fetchAsset(pdf.url);
				const pdfHash = addFile(bytes, 'application/pdf');
				const rec = out.find((r) => r.type === 'Release' && r.id === latestRelease.id);
				if (rec) {
					rec.data.pdfFile = fileRef(pdfHash);
				}
			} catch (e) {
				warnAsset(pdf.url, e);
			}
		}
	}

	for (const edge of pub.outboundEdges ?? []) {
		out.push(mapEdge(edge, pub.id));
	}

	return out;
};

/**
 * Build the full push payload for a community. Records are returned in a stable order
 * (grouped by type, sorted by id) so the manifest is deterministic.
 */
export const buildUnderlayPush = async (params: {
	community: CommunityInput;
	collections: CollectionInput[];
	pubs: PubInput[];
	options: PushOptions;
	renderReleaseHtml: (ctx: { pub: PubInput; release: ReleaseInput }) => Promise<string>;
	fetchAsset?: (url: string) => Promise<Buffer>;
}): Promise<UnderlayPushPayload> => {
	const { community, collections, pubs, options, renderReleaseHtml, fetchAsset } = params;

	const records: UnderlayRecord[] = [];
	const filesByHash = new Map<string, UnderlayFile>();

	const addFile = (bytes: Buffer, contentType: string): string => {
		const hash = hashBytes(bytes);
		if (!filesByHash.has(hash)) {
			filesByHash.set(hash, { hash, contentType, bytes });
		}
		return hash;
	};

	records.push(...mapCommunityScopeRecords(community, collections, pubs));

	for (const pub of pubs) {
		// biome-ignore lint/performance/noAwaitInLoops: pubs mapped sequentially to bound memory
		const pubRecords = await mapPubRecords(pub, {
			community,
			options,
			addFile,
			renderReleaseHtml,
			fetchAsset,
		});
		records.push(...pubRecords);
	}

	// Stable ordering: by type, then id.
	records.sort((a, b) =>
		a.type === b.type ? a.id.localeCompare(b.id) : a.type.localeCompare(b.type),
	);

	// Only include schemas for types actually present.
	const presentTypes = new Set(records.map((r) => r.type));
	const schemas: Record<string, JsonSchema> = {};
	for (const type of Object.keys(underlaySchemas)) {
		if (presentTypes.has(type)) {
			schemas[type] = underlaySchemas[type];
		}
	}

	return {
		records,
		schemas,
		files: [...filesByHash.values()].sort((a, b) => a.hash.localeCompare(b.hash)),
	};
};

/** Build the {id, type, hash} manifest for a set of records. */
export const buildManifest = (records: UnderlayRecord[]): ManifestEntry[] =>
	records.map((r) => {
		const { hash } = hashRecord(r);
		return r.private
			? { id: r.id, type: r.type, hash, private: true }
			: { id: r.id, type: r.type, hash };
	});

/**
 * Deterministic signature over the push's constituent parts (manifest entries + file hashes +
 * schemas), independent of ordering. Shared by the full and incremental paths so a no-change push
 * produces the same signature regardless of which path (or how much of the cache) was used.
 */
export const computeSignatureFromParts = (
	manifest: ManifestEntry[],
	fileHashes: string[],
	schemas: Record<string, JsonSchema>,
): string => {
	const signatureBody = {
		records: manifest.map((m) => `${m.type}:${m.id}:${m.hash}:${m.private ? 1 : 0}`).sort(),
		files: [...new Set(fileHashes)].sort(),
		schemas: Object.fromEntries(
			Object.entries(schemas).map(([type, schema]) => [
				type,
				hashBytes(Buffer.from(JSON.stringify(schema))),
			]),
		),
	};
	return hashBytes(Buffer.from(JSON.stringify(signatureBody)));
};

/**
 * A single deterministic signature over the whole push (manifest + file hashes + schemas).
 * Used as the client-side no-op guard: if it equals the last push's signature, skip entirely.
 */
export const computePushSignature = (payload: UnderlayPushPayload): string =>
	computeSignatureFromParts(
		payload.manifest ?? buildManifest(payload.records),
		payload.files.map((f) => f.hash),
		payload.schemas,
	);
