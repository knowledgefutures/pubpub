import type {
	CommunityInput,
	PubInput,
	PushOptions,
	UnderlayFile,
	UnderlayRecord,
} from '../mapping';

import { describe, expect, it, vi } from 'vitest';

import { hashBytes, hashRecord } from '../hash';
import {
	buildIncrementalPush,
	type CachedPubEntry,
	computeFacetsSignature,
	isCacheHit,
	type MapPubFn,
	optionsSignature,
} from '../incremental';

const OPTIONS: PushOptions = { includeReleaseHtml: true, includeAssets: true, exportFormats: [] };

const community: CommunityInput = { id: 'c1', subdomain: 'sub', title: 'Community One' };

const makePub = (id: string, historyKey: number): PubInput => ({
	id,
	slug: id,
	title: `Pub ${id}`,
	createdAt: '2026-01-01T00:00:00.000Z',
	attributions: [{ id: `${id}-a1`, name: 'Ada', order: 0, isAuthor: true }],
	collectionPubs: [],
	releases: [{ id: `${id}-r${historyKey}`, historyKey, createdAt: '2026-01-02T00:00:00.000Z' }],
	outboundEdges: [],
});

/**
 * Deterministic stand-in for the worker's real mapPub: a Pub record + one Release record whose
 * content file is derived from the pub id and latest history key. Tracks how many times each pub
 * was mapped so tests can assert that cache hits skip mapping.
 */
const makeMapPub =
	(calls: Record<string, number>): MapPubFn =>
	async (pub) => {
		calls[pub.id] = (calls[pub.id] ?? 0) + 1;
		const historyKey = Math.max(...(pub.releases ?? []).map((r) => r.historyKey));
		const bytes = Buffer.from(`html-${pub.id}-${historyKey}`);
		const fileHash = hashBytes(bytes);
		const release = (pub.releases ?? [])[pub.releases!.length - 1];
		const records: UnderlayRecord[] = [
			{
				id: pub.id,
				type: 'Pub',
				data: { title: pub.title, slug: pub.slug, communityId: community.id },
			},
			{
				id: release.id,
				type: 'Release',
				data: { pubId: pub.id, historyKey, contentFile: { $file: `sha256:${fileHash}` } },
			},
		];
		return {
			records,
			files: [{ hash: fileHash, contentType: 'text/html', bytes }],
		};
	};

describe('underlay/incremental — options signature', () => {
	it('is stable for equal options and differs when a toggle changes', () => {
		expect(optionsSignature(OPTIONS)).toBe(optionsSignature({ ...OPTIONS }));
		expect(optionsSignature(OPTIONS)).not.toBe(
			optionsSignature({ ...OPTIONS, exportFormats: ['pdf'] }),
		);
		expect(optionsSignature(OPTIONS)).not.toBe(
			optionsSignature({ ...OPTIONS, includeAssets: false }),
		);
	});
});

describe('underlay/incremental — isCacheHit', () => {
	const pub = makePub('p1', 3);
	const updatedAt = '2026-03-01T00:00:00.000Z';
	const optSig = optionsSignature(OPTIONS);
	const facetSig = 'facet-sig-1';
	const entry: CachedPubEntry = {
		pubId: 'p1',
		recordHashes: {},
		fileHashes: [],
		latestReleaseHistoryKey: 3,
		pubUpdatedAt: updatedAt,
		optionsSignature: optSig,
		facetsSignature: facetSig,
	};

	it('hits when updatedAt, latest release, options, and facets all match', () => {
		expect(isCacheHit(pub, updatedAt, entry, optSig, facetSig)).toBe(true);
	});
	it('misses when there is no cache entry', () => {
		expect(isCacheHit(pub, updatedAt, undefined, optSig, facetSig)).toBe(false);
	});
	it('misses when the pub updatedAt changed', () => {
		expect(isCacheHit(pub, '2026-04-09T00:00:00.000Z', entry, optSig, facetSig)).toBe(false);
	});
	it('misses when a new release bumped the latest history key', () => {
		expect(isCacheHit(makePub('p1', 4), updatedAt, entry, optSig, facetSig)).toBe(false);
	});
	it('misses when the push options changed', () => {
		expect(
			isCacheHit(
				pub,
				updatedAt,
				entry,
				optionsSignature({ ...OPTIONS, exportFormats: ['pdf'] }),
				facetSig,
			),
		).toBe(false);
	});
	it('misses when the pub facets changed (edit with no updatedAt bump or new release)', () => {
		expect(isCacheHit(pub, updatedAt, entry, optSig, 'facet-sig-2')).toBe(false);
	});
});

describe('underlay/incremental — buildIncrementalPush', () => {
	const pubs = [makePub('p1', 1), makePub('p2', 1)];
	const pubUpdatedAt = { p1: '2026-01-05T00:00:00.000Z', p2: '2026-01-06T00:00:00.000Z' };

	it('maps every pub on a cold cache and stages a cache entry per pub', async () => {
		const calls: Record<string, number> = {};
		const result = await buildIncrementalPush({
			community,
			collections: [],
			pubs,
			pubUpdatedAt,
			options: OPTIONS,
			cacheEntries: [],
			mapPub: makeMapPub(calls),
		});

		expect(result.stats).toEqual({ totalPubs: 2, cacheHits: 0, cacheMisses: 2 });
		expect(calls).toEqual({ p1: 1, p2: 1 });
		expect(result.cacheUpserts.map((e) => e.pubId).sort()).toEqual(['p1', 'p2']);
		expect(result.presentPubIds.sort()).toEqual(['p1', 'p2']);
		// Manifest carries community-scope records (Community; the fixture's attributions are name-only,
		// so no User records) plus 2 Pub + 2 Release.
		const types = result.payload.manifest!.map((m) => m.type).sort();
		expect(types).toEqual(['Community', 'Pub', 'Pub', 'Release', 'Release']);
		expect(result.payload.files).toHaveLength(2);
	});

	it('re-uses the cache with no re-mapping when nothing changed (identical signature)', async () => {
		const coldCalls: Record<string, number> = {};
		const cold = await buildIncrementalPush({
			community,
			collections: [],
			pubs,
			pubUpdatedAt,
			options: OPTIONS,
			cacheEntries: [],
			mapPub: makeMapPub(coldCalls),
		});

		const warmCalls: Record<string, number> = {};
		const warm = await buildIncrementalPush({
			community,
			collections: [],
			pubs,
			pubUpdatedAt,
			options: OPTIONS,
			cacheEntries: cold.cacheUpserts,
			mapPub: makeMapPub(warmCalls),
		});

		expect(warm.stats).toEqual({ totalPubs: 2, cacheHits: 2, cacheMisses: 0 });
		expect(warmCalls).toEqual({}); // no pub was re-mapped
		expect(warm.cacheUpserts).toHaveLength(0); // nothing to write
		expect(warm.signature).toBe(cold.signature); // true no-op
	});

	it('re-maps only the changed pub', async () => {
		const cold = await buildIncrementalPush({
			community,
			collections: [],
			pubs,
			pubUpdatedAt,
			options: OPTIONS,
			cacheEntries: [],
			mapPub: makeMapPub({}),
		});

		const warmCalls: Record<string, number> = {};
		const warm = await buildIncrementalPush({
			community,
			collections: [],
			pubs,
			// p1's updatedAt changed → miss; p2 unchanged → hit.
			pubUpdatedAt: { ...pubUpdatedAt, p1: '2026-02-01T00:00:00.000Z' },
			options: OPTIONS,
			cacheEntries: cold.cacheUpserts,
			mapPub: makeMapPub(warmCalls),
		});

		expect(warm.stats).toEqual({ totalPubs: 2, cacheHits: 1, cacheMisses: 1 });
		expect(warmCalls).toEqual({ p1: 1 });
		expect(warm.cacheUpserts.map((e) => e.pubId)).toEqual(['p1']);
	});

	it('re-maps a pub whose facets changed even when updatedAt and releases are identical', async () => {
		const facetsV1 = { p1: 'fp1-v1', p2: 'fp2-v1' };
		const cold = await buildIncrementalPush({
			community,
			collections: [],
			pubs,
			pubUpdatedAt,
			pubFacetsSignature: facetsV1,
			options: OPTIONS,
			cacheEntries: [],
			mapPub: makeMapPub({}),
		});
		expect(
			cold.cacheUpserts.every((e) => e.facetsSignature === facetsV1[e.pubId as 'p1' | 'p2']),
		).toBe(true);

		const warmCalls: Record<string, number> = {};
		const warm = await buildIncrementalPush({
			community,
			collections: [],
			pubs,
			pubUpdatedAt, // unchanged
			// p1's resolved facets changed (e.g. a collection/pub facet edit); p2 unchanged.
			pubFacetsSignature: { ...facetsV1, p1: 'fp1-v2' },
			options: OPTIONS,
			cacheEntries: cold.cacheUpserts,
			mapPub: makeMapPub(warmCalls),
		});

		expect(warm.stats).toEqual({ totalPubs: 2, cacheHits: 1, cacheMisses: 1 });
		expect(warmCalls).toEqual({ p1: 1 }); // only the facet-changed pub re-mapped
		expect(warm.cacheUpserts.map((e) => e.pubId)).toEqual(['p1']);
		expect(warm.cacheUpserts[0].facetsSignature).toBe('fp1-v2'); // new signature persisted
	});

	it('lazily re-hydrates a cache-hit pub when the server unexpectedly needs its record/file', async () => {
		const cold = await buildIncrementalPush({
			community,
			collections: [],
			pubs,
			pubUpdatedAt,
			options: OPTIONS,
			cacheEntries: [],
			mapPub: makeMapPub({}),
		});

		const mapPub = vi.fn(makeMapPub({}));
		const warm = await buildIncrementalPush({
			community,
			collections: [],
			pubs,
			pubUpdatedAt,
			options: OPTIONS,
			cacheEntries: cold.cacheUpserts,
			mapPub,
		});
		// All hits → nothing mapped during assembly.
		expect(mapPub).not.toHaveBeenCalled();

		// The server asks for p1's Release record and its content file (both from the cache).
		const p1Entry = cold.cacheUpserts.find((e) => e.pubId === 'p1')!;
		const releaseHash = Object.values(p1Entry.recordHashes).find(
			(r) => r.type === 'Release',
		)!.hash;
		const fileHash = p1Entry.fileHashes[0];

		const record = await warm.payload.resolveRecordByHash!(releaseHash);
		const file = await warm.payload.resolveFileByHash!(fileHash);

		expect(record).not.toBeNull();
		expect(hashRecord(record!).hash).toBe(releaseHash); // producing it reproduces the requested hash
		expect(file?.hash).toBe(fileHash);
		// Twice, not once: RECORDS are memoized per pub, FILES deliberately are not. Caching the
		// bytes that re-mapping yields would reaccumulate the whole collection in memory on a
		// resumed push, which is exactly what streaming exists to prevent — so the file resolve
		// re-maps rather than reading a retained byte cache.
		expect(mapPub).toHaveBeenCalledTimes(2);
		expect(mapPub).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }));

		// An unknown hash resolves to null rather than throwing.
		expect(await warm.payload.resolveRecordByHash!('deadbeef')).toBeNull();
	});
});

describe('underlay/incremental — computeFacetsSignature', () => {
	it('is stable and independent of object key order (canonicalized)', () => {
		const a = { License: { kind: 'cc-by' }, CitationStyle: { name: 'apa' } };
		const b = { CitationStyle: { name: 'apa' }, License: { kind: 'cc-by' } };
		expect(computeFacetsSignature(a)).toBe(computeFacetsSignature(b));
	});
	it('changes when a resolved facet value changes, and treats empty/undefined alike', () => {
		const base = { License: { kind: 'cc-by' } };
		expect(computeFacetsSignature(base)).not.toBe(
			computeFacetsSignature({ License: { kind: 'cc-0' } }),
		);
		expect(computeFacetsSignature(undefined)).toBe(computeFacetsSignature({}));
	});

	/**
	 * Cascade correctness. `fetchFacetsForScopeIds({ pub })` resolves the community→collection→pub
	 * stack into one value per pub, so `computeFacetsSignature(resolved[pubId])` inherits the cascade:
	 * an edit at a scope changes the resolved value — and thus the signature — of exactly the pubs that
	 * scope reaches. We model the resolver's per-pub output for two pubs (p1 ∈ colA, p2 ∈ colB) and
	 * assert which signatures move for an edit at each scope level.
	 */
	describe('cascade invalidation', () => {
		// Baseline resolved facets: both pubs inherit the same community-level values.
		const resolvedBaseline = {
			p1: { License: { kind: 'cc-by' }, CitationStyle: { name: 'apa' } },
			p2: { License: { kind: 'cc-by' }, CitationStyle: { name: 'apa' } },
		};
		const sigOf = (r: Record<'p1' | 'p2', unknown>) => ({
			p1: computeFacetsSignature(r.p1),
			p2: computeFacetsSignature(r.p2),
		});
		const base = sigOf(resolvedBaseline);

		it('community-scope edit invalidates ALL pubs', () => {
			// A community License change resolves down to every pub.
			const resolved = {
				p1: { License: { kind: 'cc-0' }, CitationStyle: { name: 'apa' } },
				p2: { License: { kind: 'cc-0' }, CitationStyle: { name: 'apa' } },
			};
			const sig = sigOf(resolved);
			expect(sig.p1).not.toBe(base.p1);
			expect(sig.p2).not.toBe(base.p2);
		});

		it('collection-scope edit invalidates only pubs in that collection', () => {
			// colA overrides CitationStyle → only p1's resolved value changes.
			const resolved = {
				p1: { License: { kind: 'cc-by' }, CitationStyle: { name: 'mla' } },
				p2: resolvedBaseline.p2,
			};
			const sig = sigOf(resolved);
			expect(sig.p1).not.toBe(base.p1);
			expect(sig.p2).toBe(base.p2);
		});

		it('pub-scope edit invalidates only that pub', () => {
			// A facet set directly on p2 → only p2's resolved value changes.
			const resolved = {
				p1: resolvedBaseline.p1,
				p2: {
					License: { kind: 'cc-by' },
					CitationStyle: { name: 'apa' },
					PubHeaderTheme: { backgroundColor: '#000' },
				},
			};
			const sig = sigOf(resolved);
			expect(sig.p1).toBe(base.p1);
			expect(sig.p2).not.toBe(base.p2);
		});
	});
});

describe('underlay/incremental — MAPPING_VERSION invalidation', () => {
	it('is stable for the same options + version, and changes when the mapping version bumps', () => {
		const base = optionsSignature(OPTIONS);
		// Deterministic across calls with the same version.
		expect(optionsSignature(OPTIONS)).toBe(base);
		// A shape/version bump changes the signature → every cache entry invalidates once.
		expect(optionsSignature(OPTIONS, 'next-version')).not.toBe(base);
	});
});

describe('underlay/incremental — immutable asset cache', () => {
	const url = 'https://assets.pubpub.org/logo.png';
	const brandedCommunity: CommunityInput = { ...community, avatar: url };

	it('references a preloaded scope image without downloading, and resolves its bytes lazily by hash', async () => {
		const bytes = Buffer.from('logo-bytes');
		const hash = hashBytes(bytes);
		let fetchCalls = 0;
		const assetCache = {
			preloaded: new Map([[url, { hash, fileName: 'logo.png', mimeType: 'image/png' }]]),
			learned: new Map(),
			byHash: new Map(),
		};
		const result = await buildIncrementalPush({
			community: brandedCommunity,
			collections: [],
			pubs: [],
			pubUpdatedAt: {},
			options: OPTIONS,
			cacheEntries: [],
			mapPub: makeMapPub({}),
			fetchAsset: async () => {
				fetchCalls += 1;
				return bytes;
			},
			assetCache,
		});

		// Assembling the push did NOT download the logo (cache hit).
		expect(fetchCalls).toBe(0);
		// It is NOT held as eager bytes …
		expect(result.payload.files.some((f) => f.hash === hash)).toBe(false);
		// … but its bytes are produced on demand and verified against the declared hash.
		const file = await result.payload.resolveFileByHash?.(hash);
		expect(file?.hash).toBe(hash);
		expect(file?.bytes.equals(bytes)).toBe(true);
		expect(file?.contentType).toBe('image/png');
		expect(fetchCalls).toBe(1);
	});

	it('throws if a cached asset URL no longer hashes to the declared hash (poisoned/mutable)', async () => {
		const declaredHash = 'deadbeefdeadbeef';
		const assetCache = {
			preloaded: new Map([
				[url, { hash: declaredHash, fileName: 'logo.png', mimeType: 'image/png' }],
			]),
			learned: new Map(),
			byHash: new Map(),
		};
		const result = await buildIncrementalPush({
			community: brandedCommunity,
			collections: [],
			pubs: [],
			pubUpdatedAt: {},
			options: OPTIONS,
			cacheEntries: [],
			mapPub: makeMapPub({}),
			fetchAsset: async () => Buffer.from('different-bytes'),
			assetCache,
		});
		await expect(result.payload.resolveFileByHash?.(declaredHash)).rejects.toThrow(/mismatch/);
	});
});

describe('underlay/incremental — streaming file upload', () => {
	const pubs = [makePub('p1', 1), makePub('p2', 1)];
	const pubUpdatedAt = { p1: '2026-01-05T00:00:00.000Z', p2: '2026-01-06T00:00:00.000Z' };

	const buildStreaming = async (uploaded: UnderlayFile[]) =>
		buildIncrementalPush({
			community,
			collections: [],
			pubs,
			pubUpdatedAt,
			options: OPTIONS,
			cacheEntries: [],
			mapPub: makeMapPub({}),
			uploadFile: async (file) => {
				uploaded.push(file);
			},
		});

	it('uploads every file during mapping and retains no bytes', async () => {
		const uploaded: UnderlayFile[] = [];
		const result = await buildStreaming(uploaded);

		// Both pubs' content files went up as they were mapped...
		expect(uploaded).toHaveLength(2);
		expect(uploaded.every((f) => f.bytes.length > 0)).toBe(true);
		// ...and nothing is held afterwards, which is the whole point.
		expect(result.payload.files).toHaveLength(0);
		// The hashes are still declared, so negotiate sees an identical file set.
		expect(result.payload.fileHashes).toEqual(uploaded.map((f) => f.hash).sort());
	});

	it('commits exactly what a non-streaming push would (same signature and manifest)', async () => {
		const buffered = await buildIncrementalPush({
			community,
			collections: [],
			pubs,
			pubUpdatedAt,
			options: OPTIONS,
			cacheEntries: [],
			mapPub: makeMapPub({}),
		});
		const streamed = await buildStreaming([]);

		// Streaming is a transport change, not a content change — the version must be identical, or
		// the no-op guard would fire spuriously on the next push.
		expect(streamed.signature).toBe(buffered.signature);
		expect(streamed.payload.manifest).toEqual(buffered.payload.manifest);
		expect(streamed.payload.fileHashes).toEqual(
			buffered.payload.files.map((f) => f.hash).sort(),
		);
	});

	it('uploads a file shared by several pubs only once', async () => {
		const shared = Buffer.from('shared-bytes');
		const sharedHash = hashBytes(shared);
		const uploaded: UnderlayFile[] = [];

		await buildIncrementalPush({
			community,
			collections: [],
			pubs,
			pubUpdatedAt,
			options: OPTIONS,
			cacheEntries: [],
			// Both pubs reference the identical file.
			mapPub: async (pub) => ({
				records: [{ id: pub.id, type: 'Pub', data: { slug: pub.slug } }],
				files: [{ hash: sharedHash, contentType: 'text/html', bytes: shared }],
			}),
			uploadFile: async (file) => {
				uploaded.push(file);
			},
		});

		expect(uploaded).toHaveLength(1);
		expect(uploaded[0].hash).toBe(sharedHash);
	});

	it('keeps bytes for a scope image it could not otherwise reproduce', async () => {
		// A branding image NOT on assets.pubpub.org is never entered into the asset cache, and a
		// scope file has no owning pub to re-map — so dropping its bytes after upload would leave a
		// later needed_files request for it unrecoverable.
		const bytes = Buffer.from('external-logo');
		const hash = hashBytes(bytes);
		const uploaded: UnderlayFile[] = [];

		const result = await buildIncrementalPush({
			community: { ...community, avatar: 'https://example.com/logo.png' },
			collections: [],
			pubs: [],
			pubUpdatedAt: {},
			options: OPTIONS,
			cacheEntries: [],
			mapPub: makeMapPub({}),
			fetchAsset: async () => bytes,
			assetCache: { preloaded: new Map(), learned: new Map(), byHash: new Map() },
			uploadFile: async (file) => {
				uploaded.push(file);
			},
		});

		// It was uploaded during mapping like any other file …
		expect(uploaded.map((f) => f.hash)).toContain(hash);
		// … but its bytes are retained, because nothing else could produce them again.
		expect(result.payload.files.some((f) => f.hash === hash)).toBe(true);
		expect(result.payload.fileHashes).toContain(hash);
	});

	it('drops bytes for a scope image that can be re-fetched from its immutable URL', async () => {
		// The assets.pubpub.org counterpart: the localizer records url→hash, so resolveFileByHash can
		// re-fetch it and the bytes need not be held.
		const bytes = Buffer.from('cacheable-logo');
		const hash = hashBytes(bytes);

		const result = await buildIncrementalPush({
			community: { ...community, avatar: 'https://assets.pubpub.org/logo.png' },
			collections: [],
			pubs: [],
			pubUpdatedAt: {},
			options: OPTIONS,
			cacheEntries: [],
			mapPub: makeMapPub({}),
			fetchAsset: async () => bytes,
			assetCache: { preloaded: new Map(), learned: new Map(), byHash: new Map() },
			uploadFile: async () => {},
		});

		expect(result.payload.files.some((f) => f.hash === hash)).toBe(false);
		expect(result.payload.fileHashes).toContain(hash);
		const recovered = await result.payload.resolveFileByHash?.(hash);
		expect(recovered?.bytes.equals(bytes)).toBe(true);
	});

	it('can still regenerate a streamed file the server unexpectedly asks for', async () => {
		const uploaded: UnderlayFile[] = [];
		const result = await buildStreaming(uploaded);

		// Bytes were dropped after upload, but the pub that produced them is still resolvable — so a
		// server that GC'd the blob (or never received it) can be served without failing the push.
		const wanted = uploaded[0].hash;
		const resolved = await result.payload.resolveFileByHash?.(wanted);
		expect(resolved?.hash).toBe(wanted);
		expect(hashBytes(resolved!.bytes)).toBe(wanted);
	});
});

describe('underlay/incremental — upload concurrency and checkpointing', () => {
	const manyPubs = Array.from({ length: 40 }, (_, i) => makePub(`p${i}`, 1));
	const manyUpdatedAt = Object.fromEntries(
		manyPubs.map((p) => [p.id, '2026-01-05T00:00:00.000Z']),
	);

	it('overlaps uploads instead of running them one at a time', async () => {
		let inFlight = 0;
		let peak = 0;
		await buildIncrementalPush({
			community,
			collections: [],
			pubs: manyPubs,
			pubUpdatedAt: manyUpdatedAt,
			options: OPTIONS,
			cacheEntries: [],
			mapPub: makeMapPub({}),
			uploadFile: async () => {
				inFlight += 1;
				peak = Math.max(peak, inFlight);
				await new Promise((r) => setTimeout(r, 5));
				inFlight -= 1;
			},
		});
		// Serial uploads would never exceed one in flight; that was the hours-long behaviour.
		expect(peak).toBeGreaterThan(1);
	});

	it('never leaves an upload in flight once the push is assembled', async () => {
		let settled = 0;
		let started = 0;
		const result = await buildIncrementalPush({
			community,
			collections: [],
			pubs: manyPubs,
			pubUpdatedAt: manyUpdatedAt,
			options: OPTIONS,
			cacheEntries: [],
			mapPub: makeMapPub({}),
			uploadFile: async () => {
				started += 1;
				await new Promise((r) => setTimeout(r, 3));
				settled += 1;
			},
		});
		// The manifest declares these hashes as already present, so every byte must have landed.
		expect(settled).toBe(started);
		expect(started).toBe(result.payload.fileHashes!.length);
	});

	it('fails the push when an upload fails, rather than committing a version missing files', async () => {
		await expect(
			buildIncrementalPush({
				community,
				collections: [],
				pubs: manyPubs,
				pubUpdatedAt: manyUpdatedAt,
				options: OPTIONS,
				cacheEntries: [],
				mapPub: makeMapPub({}),
				uploadFile: async (file) => {
					if (file.hash.length > 0) throw new Error('upload exploded');
				},
			}),
		).rejects.toThrow(/upload exploded/);
	});

	it('checkpoints only pubs whose bytes have actually landed', async () => {
		const landed = new Set<string>();
		const checkpointed: string[] = [];
		await buildIncrementalPush({
			community,
			collections: [],
			pubs: manyPubs,
			pubUpdatedAt: manyUpdatedAt,
			options: OPTIONS,
			cacheEntries: [],
			mapPub: makeMapPub({}),
			uploadFile: async (file) => {
				await new Promise((r) => setTimeout(r, 2));
				landed.add(file.hash);
			},
			flushCacheEntries: async (entries) => {
				for (const e of entries) {
					// Every file this pub declares must already be on the server at checkpoint time.
					for (const h of e.fileHashes) expect(landed.has(h)).toBe(true);
					checkpointed.push(e.pubId);
				}
			},
		});
		expect(checkpointed.sort()).toEqual(manyPubs.map((p) => p.id).sort());
	});

	it('lets a resumed push skip pubs checkpointed by a previous failed attempt', async () => {
		const firstAttemptEntries: CachedPubEntry[] = [];
		await buildIncrementalPush({
			community,
			collections: [],
			pubs: manyPubs,
			pubUpdatedAt: manyUpdatedAt,
			options: OPTIONS,
			cacheEntries: [],
			mapPub: makeMapPub({}),
			uploadFile: async () => {},
			flushCacheEntries: async (entries) => {
				firstAttemptEntries.push(...entries);
			},
		});

		// Retry using only what the (failed) first attempt managed to checkpoint.
		const retryCalls: Record<string, number> = {};
		const uploads: string[] = [];
		const retry = await buildIncrementalPush({
			community,
			collections: [],
			pubs: manyPubs,
			pubUpdatedAt: manyUpdatedAt,
			options: OPTIONS,
			cacheEntries: firstAttemptEntries,
			mapPub: makeMapPub(retryCalls),
			uploadFile: async (f) => {
				uploads.push(f.hash);
			},
		});

		expect(retry.stats.cacheHits).toBe(manyPubs.length);
		expect(retryCalls).toEqual({}); // nothing re-rendered
		expect(uploads).toEqual([]); // nothing re-uploaded
	});
});

describe('underlay/incremental — resumed push re-supplies records without hoarding bytes', () => {
	const pubs = [makePub('p1', 1), makePub('p2', 1)];
	const pubUpdatedAt = { p1: '2026-01-05T00:00:00.000Z', p2: '2026-01-06T00:00:00.000Z' };

	/**
	 * A checkpointed pub has had its FILES uploaded, but records are only sent after negotiate — so a
	 * push that died mid-mapping leaves cache entries whose records the server has never seen. The
	 * next push must be able to produce them on demand, without retaining the file bytes that
	 * re-mapping also yields.
	 */
	const checkpointedEntriesFrom = async () => {
		const first = await buildIncrementalPush({
			community,
			collections: [],
			pubs,
			pubUpdatedAt,
			options: OPTIONS,
			cacheEntries: [],
			mapPub: makeMapPub({}),
			uploadFile: async () => {},
			flushCacheEntries: async () => {},
		});
		return first.cacheUpserts;
	};

	it('produces records for a checkpointed pub the server never received', async () => {
		const entries = await checkpointedEntriesFrom();
		const calls: Record<string, number> = {};
		const resumed = await buildIncrementalPush({
			community,
			collections: [],
			pubs,
			pubUpdatedAt,
			options: OPTIONS,
			cacheEntries: entries,
			mapPub: makeMapPub(calls),
			uploadFile: async () => {},
		});

		expect(resumed.stats.cacheHits).toBe(2);
		expect(calls).toEqual({}); // nothing re-mapped during assembly

		// The server asks for a cache-hit pub's record; it must be resolvable.
		const wanted = Object.values(entries[0].recordHashes)[0].hash;
		const record = await resumed.payload.resolveRecordByHash?.(wanted);
		expect(record).toBeTruthy();
	});

	it('memoizes records but never retains file bytes between resolutions', async () => {
		const entries = await checkpointedEntriesFrom();
		const calls: Record<string, number> = {};
		const resumed = await buildIncrementalPush({
			community,
			collections: [],
			pubs,
			pubUpdatedAt,
			options: OPTIONS,
			cacheEntries: entries,
			mapPub: makeMapPub(calls),
			uploadFile: async () => {},
		});

		const hashes = Object.values(entries[0].recordHashes).map((r) => r.hash);
		await resumed.payload.resolveRecordByHash?.(hashes[0]);
		await resumed.payload.resolveRecordByHash?.(hashes[1] ?? hashes[0]);
		// Records are memoized: one re-map serves every record of that pub.
		expect(calls.p1).toBe(1);

		// Files are NOT memoized — resolving one re-maps rather than reading a retained byte cache.
		// That re-map is the observable proof the bytes were dropped.
		const fileHash = entries[0].fileHashes[0];
		const file = await resumed.payload.resolveFileByHash?.(fileHash);
		expect(file?.hash).toBe(fileHash);
		expect(calls.p1).toBe(2);
	});
});
