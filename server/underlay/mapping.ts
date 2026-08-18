import { getAssetUrlFromResizedUrl } from 'utils/images';

import { canonicalize, hashBytes, hashRecord, hashSchema } from './hash';

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
	/** Original filename (with extension) — sent to consumers via the record's file reference. */
	fileName?: string;
	bytes: Buffer;
};

/** A non-fatal issue during mapping (e.g. an asset that failed to download and was skipped). */
export type AssetWarning = {
	/** The pub the asset belongs to, or undefined for community/collection/author-scope assets. */
	pubId?: string;
	/** The asset URL that failed; absent for non-asset warnings (e.g. a skipped release). */
	assetUrl?: string;
	reason: string;
};

/**
 * Version of the record/schema SHAPE this module emits. Fold into the incremental cache key (see
 * `optionsSignature`) and bump whenever the emitted `data` shape changes, so every cache entry
 * invalidates exactly once and unchanged pubs are re-mapped with the new shape instead of silently
 * re-emitting stale hashes. Bump on any change to a type's emitted fields.
 */
export const MAPPING_VERSION = '10';

export type ManifestEntry = { id: string; type: string; hash: string; private?: boolean };

export type UnderlayPushPayload = {
	records: UnderlayRecord[];
	schemas: Record<string, JsonSchema>;
	/**
	 * Deduplicated by hash. Empty when the push streams files (see `fileHashes`): bytes are uploaded
	 * as each pub is mapped and then dropped, so nothing proportional to the collection is retained.
	 */
	files: UnderlayFile[];
	/**
	 * Every file hash this version references, whether or not its bytes are still in `files`. The
	 * streaming path uploads bytes during mapping and keeps only hashes, so this — not `files` — is
	 * what the negotiate call must declare. Falls back to the hashes of `files` when omitted.
	 */
	fileHashes?: string[];
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
	addFile: (bytes: Buffer, contentType: string, fileName?: string) => string;
	renderReleaseHtml: (ctx: { pub: PubInput; release: ReleaseInput }) => Promise<string | null>;
	fetchAsset?: (url: string) => Promise<Buffer>;
	/**
	 * Called when an asset/PDF fails to download and is skipped (non-fatal). Lets the caller
	 * collect the warnings and surface them to the admin instead of failing the whole push.
	 */
	onAssetWarning?: (warning: AssetWarning) => void;
};

export type PushOptions = {
	includeReleaseHtml: boolean;
	includeAssets: boolean;
	/** Export formats (pdf/epub/jats/…) to push as downloadable files on each Release. */
	exportFormats: string[];
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
	// Canonical identity + branding. Image fields are localized to `$file` references (see item 6 of
	// the durability handoff); scalars are stored as-is. Pure layout/visibility toggles are NOT pushed.
	avatar?: string | null;
	favicon?: string | null;
	headerLogo?: string | null;
	heroLogo?: string | null;
	heroImage?: string | null;
	heroBackgroundImage?: string | null;
	accentColorLight?: string | null;
	accentColorDark?: string | null;
	heroBackgroundColor?: string | null;
	heroTitle?: string | null;
	heroText?: string | null;
	website?: string | null;
	facebook?: string | null;
	twitter?: string | null;
	instagram?: string | null;
	mastodon?: string | null;
	linkedin?: string | null;
	bluesky?: string | null;
	github?: string | null;
	email?: string | null;
};

export type CollectionInput = {
	id: string;
	title: string;
	slug?: string | null;
	kind?: string | null;
	doi?: string | null;
	isPublic?: boolean | null;
	avatar?: string | null;
	metadata?: Record<string, unknown> | null;
};

export type AttributionInput = {
	id: string;
	/** PubPub user id when the credit is linked to a real account (else null for name-only credits). */
	userId?: string | null;
	name?: string | null;
	avatar?: string | null;
	title?: string | null;
	affiliation?: string | null;
	orcid?: string | null;
	isAuthor?: boolean | null;
	order?: number | null;
	roles?: string[] | null;
	user?: {
		id?: string | null;
		fullName?: string | null;
		orcid?: string | null;
		avatar?: string | null;
		slug?: string | null;
		title?: string | null;
	} | null;
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
	/** Formatted title (may contain inline markup); canonical, distinct from plain `title`. */
	htmlTitle?: string | null;
	description?: string | null;
	/** Formatted description (may contain inline markup); parity with `htmlTitle`. */
	htmlDescription?: string | null;
	/** Pub avatar image URL, localized to a content-addressed file. */
	avatar?: string | null;
	/** External identifiers (e.g. `bibcode`, `mtg_id`); emitted as-is when present. */
	metadata?: Record<string, Json> | null;
	/** Editorial categorization labels; only `id` + `title` are canonical (color/workflow dropped). */
	labels?: { id: string; title: string }[] | null;
	doi?: string | null;
	createdAt: string | Date;
	/** Editorially-set publication date (citation date); may differ from row timestamps. */
	customPublishedAt?: string | Date | null;
	/** License facet kind (e.g. "cc-by-nc-nd") + resolved SPDX id and URI. */
	license?: string | null;
	licenseSpdx?: string | null;
	licenseUri?: string | null;
	/** Scholarly kind (JournalArticle / Preprint / BookChapter / …), derived by the caller. */
	kind?: string | null;
	attributions?: AttributionInput[] | null;
	collectionPubs?: { collectionId: string }[] | null;
	releases?: ReleaseInput[] | null;
	outboundEdges?: PubEdgeInput[] | null;
	/** Per-format export artifacts (pdf/epub/…) from PubPub's exports table, matched to a release by
	 * historyKey. `url` is the S3 asset URL (only non-null entries are passed in). */
	exports?: { format: string; url: string; historyKey: number }[] | null;
};

const FILE_PREFIX = 'sha256:';
/**
 * A record's reference to a content-addressed file. Underlay stores files by hash only (no
 * filename/type), so we carry the original `fileName` + `mimeType` on the reference itself, letting
 * consumers reconstruct the extension and content type.
 */
const fileRef = (
	hash: string,
	fileName?: string,
	mimeType?: string,
	originalUrl?: string,
): Record<string, Json> =>
	compact({ $file: `${FILE_PREFIX}${hash}`, fileName, mimeType, originalUrl });

/** Best-effort original filename (with extension) from an asset URL, for the file reference. */
const assetFileName = (url: string): string => {
	try {
		const base = new URL(url).pathname.split('/').pop();
		return base ? decodeURIComponent(base) : 'asset';
	} catch {
		return 'asset';
	}
};

const toIso = (value: string | Date): string =>
	typeof value === 'string' ? new Date(value).toISOString() : value.toISOString();

/** Canonical mime type per PubPub export format. */
const EXPORT_MIME: Record<string, string> = {
	pdf: 'application/pdf',
	epub: 'application/epub+zip',
	jats: 'application/xml',
	docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	tex: 'application/x-tex',
	markdown: 'text/markdown',
	html: 'text/html',
	odt: 'application/vnd.oasis.opendocument.text',
	plain: 'text/plain',
	json: 'application/json',
};
/** File extension per PubPub export format (for the downloadable file's name). */
const EXPORT_EXT: Record<string, string> = {
	pdf: 'pdf',
	epub: 'epub',
	jats: 'xml',
	docx: 'docx',
	tex: 'tex',
	markdown: 'md',
	html: 'html',
	odt: 'odt',
	plain: 'txt',
	json: 'json',
};

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
		case 'ico':
			return 'image/x-icon';
		case 'pdf':
			return 'application/pdf';
		default:
			return 'application/octet-stream';
	}
};

/**
 * Matches an `assets.pubpub.org` URL that is the value of a quoted attribute (`src="…"`, `href='…'`,
 * `data-…="…"`, and quoted `url("…")`). The URL is captured up to the CLOSING QUOTE — NOT at
 * whitespace — so filenames containing literal spaces, parens, or commas
 * (e.g. `.../Cavanagh Fig 2-123.png?width=800&fit=bounds`) are captured whole. `\1` is the opening
 * quote; the tempered `(?:(?!\1).)*` grabs everything up to the matching quote. Group 1 = quote,
 * group 2 = URL.
 */
const HTML_QUOTED_ASSET_URL = /(["'])(https:\/\/assets\.pubpub\.org\/(?:(?!\1).)*)\1/g;
/**
 * Matches an UNQUOTED CSS `url(https://assets.pubpub.org/…)`. Quoted `url("…")` is already covered by
 * `HTML_QUOTED_ASSET_URL`. Group 1 = URL (up to the closing paren).
 */
const HTML_CSS_URL_ASSET = /url\(\s*(https:\/\/assets\.pubpub\.org\/[^)"']*?)\s*\)/gi;

// ── Per-type JSON Schemas. Property sets MUST match the emitted `data` exactly. ──────────────

const fileRefSchema = {
	type: 'object',
	properties: {
		$file: { type: 'string' },
		fileName: { type: 'string' },
		mimeType: { type: 'string' },
		/** Provenance: the source URL this file was localized from (kept out of the HTML itself). */
		originalUrl: { type: 'string' },
	},
	required: ['$file'],
};

/** A downloadable export file reference on a Release, tagged with its format. */
const exportRefSchema = {
	type: 'object',
	properties: {
		format: { type: 'string' },
		$file: { type: 'string' },
		fileName: { type: 'string' },
		mimeType: { type: 'string' },
	},
	required: ['format', '$file'],
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
			// Branding images, localized to content-addressed files.
			avatar: fileRefSchema,
			favicon: fileRefSchema,
			headerLogo: fileRefSchema,
			heroLogo: fileRefSchema,
			heroImage: fileRefSchema,
			heroBackgroundImage: fileRefSchema,
			// Branding scalars.
			accentColorLight: { type: 'string' },
			accentColorDark: { type: 'string' },
			heroBackgroundColor: { type: 'string' },
			heroTitle: { type: 'string' },
			heroText: { type: 'string' },
			// Social / external links.
			website: { type: 'string' },
			facebook: { type: 'string' },
			twitter: { type: 'string' },
			instagram: { type: 'string' },
			mastodon: { type: 'string' },
			linkedin: { type: 'string' },
			bluesky: { type: 'string' },
			github: { type: 'string' },
			email: { type: 'string' },
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
			avatar: fileRefSchema,
			communityId: { type: 'string', 'x-ref-type': 'Community' },
		},
	},
	/**
	 * A person (PubPub `User`), deduplicated across the whole push by real user id — a person credited
	 * on N pubs is stored once. Per-attribution relationship data lives on `PubAttribution`, not here.
	 * Only credits linked to a real account produce a `User` record; name-only credits carry their
	 * name/orcid inline on `PubAttribution` instead.
	 */
	User: {
		type: 'object',
		properties: {
			name: { type: 'string' },
			orcid: { type: 'string' },
			avatar: fileRefSchema,
			title: { type: 'string' },
			slug: { type: 'string' },
		},
	},
	/**
	 * A PubPub `PubAttribution` row: this pub credits this person, with the per-attribution
	 * role/affiliation/order. `userId` references a `User` when the credit is linked to an account;
	 * name-only credits omit it and carry `name`/`orcid` inline.
	 */
	PubAttribution: {
		type: 'object',
		properties: {
			pubId: { type: 'string', 'x-ref-type': 'Pub' },
			userId: { type: 'string', 'x-ref-type': 'User' },
			name: { type: 'string' },
			orcid: { type: 'string' },
			avatar: fileRefSchema,
			affiliation: { type: 'string' },
			roles: { type: 'array', items: { type: 'string' } },
			isAuthor: { type: 'boolean' },
			order: { type: 'number' },
		},
	},
	Pub: {
		type: 'object',
		properties: {
			title: { type: 'string' },
			htmlTitle: { type: 'string' },
			slug: { type: 'string' },
			description: { type: 'string' },
			htmlDescription: { type: 'string' },
			avatar: fileRefSchema,
			// External identifiers (bibcode, mtg_id, …); permissive object so sparse keys pass.
			metadata: { type: 'object' },
			labels: {
				type: 'array',
				items: {
					type: 'object',
					properties: { id: { type: 'string' }, title: { type: 'string' } },
				},
			},
			doi: { type: 'string' },
			kind: { type: 'string' },
			license: { type: 'string' },
			licenseSpdx: { type: 'string' },
			licenseUri: { type: 'string' },
			createdAt: { type: 'string', format: 'date-time' },
			publishedAt: { type: 'string', format: 'date-time' },
			communityId: { type: 'string', 'x-ref-type': 'Community' },
			collectionIds: { type: 'array', items: { type: 'string', 'x-ref-type': 'Collection' } },
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
			assets: { type: 'array', items: fileRefSchema },
			exports: { type: 'array', items: exportRefSchema },
		},
	},
	PubEdge: {
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

/** A cached asset (metadata only — no bytes): what the url→hash cache stores/returns. */
export type CachedAsset = { hash: string; fileName?: string; mimeType?: string };

/**
 * Shared url→hash cache for immutable `assets.pubpub.org` assets, so a push can reference an asset
 * without re-downloading it. Threaded through the scope mapping; the localizer uses `preloaded`
 * (seeded from the DB) to short-circuit a fetch, records freshly-fetched URLs in `learned` (persisted
 * after a successful commit), and populates `byHash` (hash → url) so the client can fetch bytes lazily
 * for any cached file the server actually needs.
 */
export type AssetCacheContext = {
	preloaded: Map<string, CachedAsset>;
	learned: Map<string, { hash: string; fileName: string; mimeType: string }>;
	byHash: Map<string, { url: string; fileName?: string; mimeType?: string }>;
};

/** Injected context for mapping the community-scope records (Community, Collections, Authors). */
export type ScopeMapContext = {
	addFile: (bytes: Buffer, contentType: string, fileName?: string) => string;
	fetchAsset?: (url: string) => Promise<Buffer>;
	onAssetWarning?: (warning: AssetWarning) => void;
	options: PushOptions;
	/** Shared immutable-asset cache; when set, scope images resolve from it instead of downloading. */
	assetCache?: AssetCacheContext;
	/** Registers a file hash that resolved from the cache (no bytes held) so it still reaches the manifest. */
	registerCachedHash?: (hash: string, contentType?: string, fileName?: string) => void;
};

type LocalizedAsset = { hash: string; fileName: string; mimeType: string };

const ASSET_HOST_PREFIX = 'https://assets.pubpub.org/';

/**
 * Turns a source asset URL into a content-addressed file so the stored version is self-contained —
 * nothing points back at assets.pubpub.org (which would 404 if PubPub disappears). Memoized by URL
 * (one fetch per URL per push, deterministic) and non-fatal: a fetch failure warns and yields null,
 * so the caller omits the field / leaves the URL rather than failing the whole push.
 */
const createAssetLocalizer = (
	addFile: (bytes: Buffer, contentType: string, fileName?: string) => string,
	fetchAsset?: (url: string) => Promise<Buffer>,
	onAssetWarning?: (warning: AssetWarning) => void,
	assetCache?: AssetCacheContext,
	registerCachedHash?: (hash: string, contentType?: string, fileName?: string) => void,
) => {
	const memo = new Map<string, Promise<LocalizedAsset | null>>();
	const localize = (url: string, pubId?: string): Promise<LocalizedAsset | null> => {
		if (!fetchAsset) {
			return Promise.resolve(null);
		}
		let pending = memo.get(url);
		if (!pending) {
			pending = (async () => {
				const isCacheable = assetCache !== undefined && url.startsWith(ASSET_HOST_PREFIX);
				// Cache hit: reference the asset by its known hash without downloading it. Its bytes are
				// only fetched later if the server asks for them (see incremental resolveFileByHash).
				if (isCacheable) {
					const hit = assetCache.preloaded.get(url);
					if (hit) {
						const fileName = hit.fileName ?? assetFileName(url);
						const mimeType = hit.mimeType ?? guessContentType(url);
						assetCache.byHash.set(hit.hash, { url, fileName, mimeType });
						registerCachedHash?.(hit.hash, mimeType, fileName);
						return { hash: hit.hash, fileName, mimeType };
					}
				}
				try {
					const bytes = await fetchAsset(url);
					const fileName = assetFileName(url);
					const mimeType = guessContentType(url);
					const hash = addFile(bytes, mimeType, fileName);
					if (isCacheable) {
						assetCache.learned.set(url, { hash, fileName, mimeType });
						assetCache.byHash.set(hash, { url, fileName, mimeType });
					}
					return { hash, fileName, mimeType };
				} catch (e) {
					const reason = e instanceof Error ? e.message : String(e);
					console.error(`[underlay] Skipped asset ${url}: ${reason}`);
					onAssetWarning?.({ pubId, assetUrl: url, reason });
					return null;
				}
			})();
			memo.set(url, pending);
		}
		return pending;
	};
	/** Localize a single-image field into a file reference, or undefined if absent / failed. */
	const localizeToRef = async (
		url: string | null | undefined,
		pubId?: string,
	): Promise<Record<string, Json> | undefined> => {
		if (!url) {
			return undefined;
		}
		const asset = await localize(url, pubId);
		return asset ? fileRef(asset.hash, asset.fileName, asset.mimeType, url) : undefined;
	};
	return { localize, localizeToRef };
};

type LocalizeToRef = ReturnType<typeof createAssetLocalizer>['localizeToRef'];

const mapCommunity = async (
	community: CommunityInput,
	localizeToRef: LocalizeToRef,
): Promise<UnderlayRecord> => ({
	id: community.id,
	type: 'Community',
	data: compact({
		subdomain: community.subdomain,
		title: community.title,
		description: community.description ?? undefined,
		issn: community.issn ?? undefined,
		publishAs: community.publishAs ?? undefined,
		citeAs: community.citeAs ?? undefined,
		avatar: await localizeToRef(community.avatar),
		favicon: await localizeToRef(community.favicon),
		headerLogo: await localizeToRef(community.headerLogo),
		heroLogo: await localizeToRef(community.heroLogo),
		heroImage: await localizeToRef(community.heroImage),
		heroBackgroundImage: await localizeToRef(community.heroBackgroundImage),
		accentColorLight: community.accentColorLight ?? undefined,
		accentColorDark: community.accentColorDark ?? undefined,
		heroBackgroundColor: community.heroBackgroundColor ?? undefined,
		heroTitle: community.heroTitle ?? undefined,
		heroText: community.heroText ?? undefined,
		website: community.website ?? undefined,
		facebook: community.facebook ?? undefined,
		twitter: community.twitter ?? undefined,
		instagram: community.instagram ?? undefined,
		mastodon: community.mastodon ?? undefined,
		linkedin: community.linkedin ?? undefined,
		bluesky: community.bluesky ?? undefined,
		github: community.github ?? undefined,
		email: community.email ?? undefined,
	}),
});

const mapCollection = async (
	collection: CollectionInput,
	communityId: string,
	localizeToRef: LocalizeToRef,
): Promise<UnderlayRecord> => ({
	id: collection.id,
	type: 'Collection',
	data: compact({
		title: collection.title,
		slug: collection.slug ?? undefined,
		kind: collection.kind ?? undefined,
		doi: collection.doi ?? undefined,
		isPublic: collection.isPublic ?? undefined,
		avatar: await localizeToRef(collection.avatar),
		communityId,
	}),
});

/**
 * The linked PubPub account id for an attribution, or null for a name-only credit. Used to emit and
 * dedupe `User` records; name-only credits produce no `User` (their name/orcid live on the
 * `PubAttribution` record instead).
 */
export const userIdFor = (attribution: AttributionInput): string | null =>
	attribution.userId ?? attribution.user?.id ?? null;

/** A person (PubPub `User`). Only called for attributions with a linked account, so `id` is the real User.id. */
const mapUser = async (
	attribution: AttributionInput,
	localizeToRef: LocalizeToRef,
): Promise<UnderlayRecord> => ({
	id: (attribution.userId ?? attribution.user?.id) as string,
	type: 'User',
	data: compact({
		name: attribution.user?.fullName ?? attribution.name ?? undefined,
		orcid: attribution.user?.orcid ?? attribution.orcid ?? undefined,
		avatar: await localizeToRef(attribution.user?.avatar ?? attribution.avatar),
		title: attribution.user?.title ?? attribution.title ?? undefined,
		slug: attribution.user?.slug ?? undefined,
	}),
});

/**
 * One record per PubPub `PubAttribution` row; `id` is the attribution's real primary key.
 *
 * Field ownership is split so person data is never duplicated: per-attribution facts
 * (`roles`/`isAuthor`/`order`/`affiliation`) always live here, but person-identity fields
 * (`name`/`avatar`/`orcid`) are emitted ONLY for name-only credits. When the credit is linked to an
 * account, this record just references the `User` by real id and the consumer resolves the name/orcid/
 * avatar from that single `User` record (so a profile edit churns one `User`, not every attribution).
 */
const mapPubAttribution = async (
	attribution: AttributionInput,
	pubId: string,
	localizeToRef: LocalizeToRef,
): Promise<UnderlayRecord> => {
	const userId = userIdFor(attribution);
	// Per-attribution / per-pub facts — always present.
	const data: Record<string, Json | null | undefined> = {
		pubId,
		affiliation: attribution.affiliation ?? undefined,
		roles:
			attribution.roles && attribution.roles.length > 0 ? [...attribution.roles] : undefined,
		isAuthor: attribution.isAuthor ?? undefined,
		order: attribution.order ?? undefined,
	};
	if (userId) {
		// Linked credit: reference the `User`; person fields resolve from that record.
		data.userId = userId;
	} else {
		// Name-only credit: no `User` exists, so carry the person fields inline.
		data.name = attribution.name ?? undefined;
		data.orcid = attribution.orcid ?? undefined;
		data.avatar = await localizeToRef(attribution.avatar);
	}
	return { id: attribution.id, type: 'PubAttribution', data: compact(data) };
};

const mapEdge = (edge: PubEdgeInput, sourcePubId: string): UnderlayRecord => ({
	id: edge.id,
	type: 'PubEdge',
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
 * `User` records across all pubs. Users are deduped by real user id, so a person credited on many
 * pubs produces exactly one `User` record; name-only credits produce none (their data lives on the
 * per-pub `PubAttribution` records). These never require rendering, so they are always recomputed
 * (never cached) on an incremental push.
 */
export const mapCommunityScopeRecords = async (
	community: CommunityInput,
	collections: CollectionInput[],
	pubs: PubInput[],
	ctx: ScopeMapContext,
): Promise<UnderlayRecord[]> => {
	// Branding/avatar images follow the includeAssets toggle: with assets off, images are omitted
	// (never left as a bare URL) so the schema property is always a file reference or absent.
	const { localizeToRef } = createAssetLocalizer(
		ctx.addFile,
		ctx.options.includeAssets ? ctx.fetchAsset : undefined,
		ctx.onAssetWarning,
		ctx.assetCache,
		ctx.registerCachedHash,
	);
	const records: UnderlayRecord[] = [await mapCommunity(community, localizeToRef)];
	for (const collection of collections) {
		// biome-ignore lint/performance/noAwaitInLoops: sequential to reuse the localizer memo + bound memory
		records.push(await mapCollection(collection, community.id, localizeToRef));
	}
	const seenUsers = new Set<string>();
	for (const pub of pubs) {
		const attributions = (pub.attributions ?? [])
			.slice()
			.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
		for (const attribution of attributions) {
			const userId = userIdFor(attribution);
			if (userId && !seenUsers.has(userId)) {
				seenUsers.add(userId);
				// biome-ignore lint/performance/noAwaitInLoops: sequential to reuse the localizer memo + bound memory
				records.push(await mapUser(attribution, localizeToRef));
			}
		}
	}
	return records;
};

/**
 * Map a SINGLE pub to its records: the Pub record, one `PubAttribution` record per attribution row,
 * one Release record per release (with rendered content + assets as file references), and its
 * outbound `PubEdge` records. Deduplicated `User` (person) records are handled by the caller; only
 * the per-attribution rows live here.
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
		console.error(`[underlay] Skipped asset ${url} for pub "${pub.slug}": ${reason}`);
		onAssetWarning?.({ pubId: pub.id, assetUrl: url, reason });
	};
	// One localizer for all of this pub's assets (attribution avatars + in-body images), gated by the
	// includeAssets toggle so nothing is fetched when assets are excluded. The localizer logs + reports
	// each failure itself (with this pub's id).
	const { localize, localizeToRef } = createAssetLocalizer(
		addFile,
		options.includeAssets ? fetchAsset : undefined,
		onAssetWarning,
	);
	const out: UnderlayRecord[] = [];

	const attributions = (pub.attributions ?? [])
		.slice()
		.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
	const releases = (pub.releases ?? []).slice().sort((a, b) => a.historyKey - b.historyKey);

	// Canonical publication date: editorial date if set, else the earliest release, else row creation.
	// All three are stable values, so this does not introduce a volatile field.
	const publishedAtSource = pub.customPublishedAt ?? releases[0]?.createdAt ?? pub.createdAt;

	const avatarRef = await localizeToRef(pub.avatar, pub.id);
	const labels =
		pub.labels && pub.labels.length > 0
			? pub.labels.map((l) => ({ id: l.id, title: l.title }))
			: undefined;
	const metadata =
		pub.metadata && Object.keys(pub.metadata).length > 0 ? pub.metadata : undefined;

	// One PubAttribution record per attribution row on this pub (id = the real attribution id).
	for (const attribution of attributions) {
		// biome-ignore lint/performance/noAwaitInLoops: sequential to reuse the localizer memo + bound memory
		out.push(await mapPubAttribution(attribution, pub.id, localizeToRef));
	}

	// One Underlay Release record per PubPub release (full, lossless history). A release whose Doc
	// content can't be loaded is SKIPPED with a warning — never published as empty content.
	const emittedReleases: typeof releases = [];
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
			if (html === null) {
				console.warn(
					`[underlay] Skipped release ${release.id} for pub "${pub.slug}": document content unavailable`,
				);
				onAssetWarning?.({
					pubId: pub.id,
					reason: `Release ${release.id}: document content unavailable — skipped`,
				});
				continue;
			}
			const htmlName = `${pub.slug}-v${release.historyKey}.html`;

			// Localize in-body assets, then rewrite their URLs to content-addressed refs BEFORE hashing
			// the HTML — so the stored contentFile is self-contained (no assets.pubpub.org URLs) and
			// every former image resolves via the version's files.
			let contentHtml = html;
			if (options.includeAssets && fetchAsset) {
				// Drop CDN responsive variants (srcset/sizes) FIRST — they're delivery artifacts, not
				// canonical content, and their multi-URL values (`url 1x, url 2x`) would defeat the
				// single-URL attribute capture below. The single content-addressed `src` remains;
				// consumers regenerate their own responsive variants.
				contentHtml = contentHtml
					.replace(/\s+srcset="[^"]*"/gi, '')
					.replace(/\s+srcset='[^']*'/gi, '')
					.replace(/\s+sizes="[^"]*"/gi, '')
					.replace(/\s+sizes='[^']*'/gi, '');

				const assets: Record<string, Json>[] = [];
				const seenAssetHash = new Set<string>();
				// Raw asset URLs exactly as they appear in the HTML — captured attribute-value-aware
				// (up to the closing quote / paren), so URLs with spaces/parens in the filename are
				// captured whole rather than truncated at the first space. Keyed by the raw string so
				// the rewrite below swaps the exact occurrence. Every responsive variant normalizes to
				// the same base asset → one hash.
				const rawUrls = new Set<string>();
				for (const m of contentHtml.matchAll(HTML_QUOTED_ASSET_URL)) {
					rawUrls.add(m[2]);
				}
				for (const m of contentHtml.matchAll(HTML_CSS_URL_ASSET)) {
					rawUrls.add(m[1]);
				}
				const tokenToHash = new Map<string, string>();
				for (const rawUrl of [...rawUrls].sort()) {
					const normalized = getAssetUrlFromResizedUrl(rawUrl);
					// biome-ignore lint/performance/noAwaitInLoops: sequential to reuse the localizer memo + bound memory
					const asset = await localize(normalized, pub.id);
					if (!asset) {
						// Failed to fetch: leave this URL in place (already warned).
						continue;
					}
					tokenToHash.set(rawUrl, asset.hash);
					if (!seenAssetHash.has(asset.hash)) {
						seenAssetHash.add(asset.hash);
						assets.push(
							fileRef(asset.hash, asset.fileName, asset.mimeType, normalized),
						);
					}
				}
				// Rewrite each captured occurrence to its content-addressed ref, preserving delimiters.
				// Deterministic: same HTML + same hashes → same output.
				contentHtml = contentHtml
					.replace(HTML_QUOTED_ASSET_URL, (match, quote, url) => {
						const hash = tokenToHash.get(url);
						return hash ? `${quote}${FILE_PREFIX}${hash}${quote}` : match;
					})
					.replace(HTML_CSS_URL_ASSET, (match, url) => {
						const hash = tokenToHash.get(url);
						return hash ? `url(${FILE_PREFIX}${hash})` : match;
					});
				if (assets.length > 0) {
					releaseData.assets = assets.sort((a, b) =>
						String(a.$file).localeCompare(String(b.$file)),
					);
				}
			}

			const htmlHash = addFile(
				Buffer.from(contentHtml, 'utf8'),
				'text/html; charset=utf-8',
				htmlName,
			);
			releaseData.contentFile = fileRef(htmlHash, htmlName, 'text/html');
		}

		// Downloadable exports (pdf/epub/…) from PubPub's exports table, matched to THIS release by
		// historyKey and filtered to the admin-selected formats. Independent of includeReleaseHtml.
		if (options.exportFormats.length > 0 && fetchAsset) {
			const releaseExports = (pub.exports ?? [])
				.filter(
					(e) =>
						e.historyKey === release.historyKey &&
						e.url &&
						options.exportFormats.includes(e.format),
				)
				.sort((a, b) => a.format.localeCompare(b.format));
			const exportRefs: Record<string, Json>[] = [];
			for (const exp of releaseExports) {
				try {
					// biome-ignore lint/performance/noAwaitInLoops: sequential to bound memory
					const bytes = await fetchAsset(exp.url);
					const mimeType = EXPORT_MIME[exp.format] ?? 'application/octet-stream';
					const fileName = `${pub.slug}.${EXPORT_EXT[exp.format] ?? exp.format}`;
					const hash = addFile(bytes, mimeType, fileName);
					exportRefs.push({ format: exp.format, ...fileRef(hash, fileName, mimeType) });
				} catch (e) {
					warnAsset(exp.url, e);
				}
			}
			if (exportRefs.length > 0) {
				releaseData.exports = exportRefs;
			}
		}

		out.push({ id: release.id, type: 'Release', data: compact(releaseData) });
		emittedReleases.push(release);
	}

	const latestEmittedRelease = emittedReleases[emittedReleases.length - 1];

	// Pub record — `latestReleaseId` points at the newest release actually emitted (skip-aware);
	// omitted entirely if every release was skipped, so it never dangles.
	out.push({
		id: pub.id,
		type: 'Pub',
		data: compact({
			title: pub.title,
			htmlTitle: pub.htmlTitle ?? undefined,
			slug: pub.slug,
			description: pub.description ?? undefined,
			htmlDescription: pub.htmlDescription ?? undefined,
			avatar: avatarRef,
			metadata,
			labels,
			doi: pub.doi ?? undefined,
			kind: pub.kind ?? undefined,
			license: pub.license ?? undefined,
			licenseSpdx: pub.licenseSpdx ?? undefined,
			licenseUri: pub.licenseUri ?? undefined,
			createdAt: toIso(pub.createdAt),
			publishedAt: publishedAtSource ? toIso(publishedAtSource) : undefined,
			communityId: community.id,
			collectionIds: (pub.collectionPubs ?? []).map((cp) => cp.collectionId).sort(),
			latestReleaseId: latestEmittedRelease?.id,
		}),
	});

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
	renderReleaseHtml: (ctx: { pub: PubInput; release: ReleaseInput }) => Promise<string | null>;
	fetchAsset?: (url: string) => Promise<Buffer>;
}): Promise<UnderlayPushPayload> => {
	const { community, collections, pubs, options, renderReleaseHtml, fetchAsset } = params;

	const records: UnderlayRecord[] = [];
	const filesByHash = new Map<string, UnderlayFile>();

	const addFile = (bytes: Buffer, contentType: string, fileName?: string): string => {
		const hash = hashBytes(bytes);
		if (!filesByHash.has(hash)) {
			filesByHash.set(hash, { hash, contentType, fileName, bytes });
		}
		return hash;
	};

	records.push(
		...(await mapCommunityScopeRecords(community, collections, pubs, {
			addFile,
			fetchAsset,
			options,
		})),
	);

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
	metadata?: Record<string, unknown> | null,
): string => {
	const signatureBody = {
		records: manifest.map((m) => `${m.type}:${m.id}:${m.hash}:${m.private ? 1 : 0}`).sort(),
		files: [...new Set(fileHashes)].sort(),
		schemas: Object.fromEntries(
			// Canonicalized (matches Underlay's own schema hashing) so the signature is stable
			// regardless of a schema literal's key insertion order — honoring the ordering guarantee.
			Object.entries(schemas).map(([type, schema]) => [type, hashSchema(schema)]),
		),
		// Version metadata (e.g. `readme`) is pushed as Underlay version metadata and produces a
		// patch version when it changes — so it MUST be part of the no-op signature, or a readme-only
		// edit would be skipped as "no changes". Canonicalized for key-order independence.
		metadata: hashBytes(Buffer.from(JSON.stringify(canonicalize((metadata ?? {}) as Json)))),
	};
	return hashBytes(Buffer.from(JSON.stringify(signatureBody)));
};

/**
 * A single deterministic signature over the whole push (manifest + file hashes + schemas + metadata).
 * Used as the client-side no-op guard: if it equals the last push's signature, skip entirely.
 */
export const computePushSignature = (
	payload: UnderlayPushPayload,
	metadata?: Record<string, unknown> | null,
): string =>
	computeSignatureFromParts(
		payload.manifest ?? buildManifest(payload.records),
		payload.files.map((f) => f.hash),
		payload.schemas,
		metadata,
	);
