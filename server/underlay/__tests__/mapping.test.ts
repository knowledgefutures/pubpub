import type {
	AssetCacheContext,
	AssetWarning,
	CollectionInput,
	CommunityInput,
	PageInput,
	PubInput,
	PushOptions,
} from '../mapping';

import { describe, expect, it } from 'vitest';

import { hashRecord } from '../hash';
import {
	buildManifest,
	buildUnderlayPush,
	computeSignatureFromParts,
	mapCommunityScopeRecords,
	mapPubRecords,
	userIdFor,
} from '../mapping';

const community: CommunityInput = { id: 'c1', subdomain: 'sub', title: 'Community One' };

const OPTIONS: PushOptions = { includeReleaseHtml: true, includeAssets: true, exportFormats: [] };

/** Renders a tiny HTML doc referencing one asset, so asset handling can be exercised. */
const renderReleaseHtml = async () =>
	'<p>Body</p><img src="https://assets.pubpub.org/abc/photo.png" />';

const fetchAsset = async (_url: string) => Buffer.from('fake-image-bytes');

const pubWithUser = (id: string, userId: string): PubInput => ({
	id,
	slug: id,
	title: `Pub ${id}`,
	createdAt: '2026-01-01T00:00:00.000Z',
	attributions: [
		{
			id: `${id}-a1`,
			userId,
			name: 'Ada Lovelace',
			orcid: '0000-0002-1825-0097',
			isAuthor: true,
			order: 0,
			roles: ['Writing'],
		},
	],
	collectionPubs: [],
	releases: [{ id: `${id}-r1`, historyKey: 1, createdAt: '2026-01-02T00:00:00.000Z' }],
	outboundEdges: [],
});

describe('underlay/mapping — userIdFor', () => {
	it('returns the linked account id, or null for a name-only credit', () => {
		expect(userIdFor({ id: 'a', userId: 'u1', user: { id: 'u1' } })).toBe('u1');
		expect(userIdFor({ id: 'a', user: { id: 'u2' } })).toBe('u2');
		expect(userIdFor({ id: 'a', orcid: '0000-2' })).toBeNull();
		expect(userIdFor({ id: 'a', name: 'Name Only' })).toBeNull();
	});
});

describe('underlay/mapping — User/PubAttribution de-duplication', () => {
	it('emits ONE User (real user id) for a person credited on N pubs, plus one PubAttribution per row (real attribution id)', async () => {
		const payload = await buildUnderlayPush({
			community,
			collections: [],
			pubs: [pubWithUser('p1', 'u1'), pubWithUser('p2', 'u1')],
			options: OPTIONS,
			renderReleaseHtml,
			fetchAsset,
		});

		const users = payload.records.filter((r) => r.type === 'User');
		expect(users).toHaveLength(1);
		// Real PubPub user id — no synthetic prefix.
		expect(users[0].id).toBe('u1');
		expect(users[0].data).toEqual({
			name: 'Ada Lovelace',
			orcid: '0000-0002-1825-0097',
		});

		const pubAttributions = payload.records.filter((r) => r.type === 'PubAttribution');
		// Ids are the real attribution row PKs — no composite.
		expect(pubAttributions.map((r) => r.id).sort()).toEqual(['p1-a1', 'p2-a1']);
		for (const r of pubAttributions) {
			expect(r.id).not.toContain(':');
		}
		// A linked attribution references the User by real id and carries only per-pub facts —
		// person-identity fields (name/orcid/avatar) live on the single User record, not here.
		expect(pubAttributions[0].data).toMatchObject({
			pubId: expect.any(String),
			userId: 'u1',
			isAuthor: true,
			roles: ['Writing'],
			order: 0,
		});
		expect(pubAttributions[0].data).not.toHaveProperty('name');
		expect(pubAttributions[0].data).not.toHaveProperty('orcid');
		expect(pubAttributions[0].data).not.toHaveProperty('avatar');
		expect(pubAttributions[0].data).not.toHaveProperty('title');

		// The Pub record does not embed contributor ids.
		const pub = payload.records.find((r) => r.type === 'Pub' && r.id === 'p1')!;
		expect(pub.data).not.toHaveProperty('contributorIds');
	});

	it('emits NO User for a name-only credit, keeping name/orcid inline on PubAttribution', async () => {
		const nameOnlyPub: PubInput = {
			id: 'p9',
			slug: 'p9',
			title: 'Pub p9',
			createdAt: '2026-01-01T00:00:00.000Z',
			attributions: [
				{ id: 'p9-a1', name: 'Grace Hopper', orcid: '0000-0003-0000-0000', order: 0 },
			],
			collectionPubs: [],
			releases: [{ id: 'p9-r1', historyKey: 1, createdAt: '2026-01-02T00:00:00.000Z' }],
			outboundEdges: [],
		};
		const payload = await buildUnderlayPush({
			community,
			collections: [],
			pubs: [nameOnlyPub],
			options: OPTIONS,
			renderReleaseHtml,
			fetchAsset,
		});

		expect(payload.records.filter((r) => r.type === 'User')).toHaveLength(0);
		const attribution = payload.records.find((r) => r.type === 'PubAttribution')!;
		expect(attribution.id).toBe('p9-a1');
		expect(attribution.data).not.toHaveProperty('userId');
		expect(attribution.data).toMatchObject({
			name: 'Grace Hopper',
			orcid: '0000-0003-0000-0000',
		});
	});
});

describe('underlay/mapping — file content-type + filename', () => {
	it('gives rendered HTML and assets real content types + filenames on both the file and the reference', async () => {
		const payload = await buildUnderlayPush({
			community,
			collections: [],
			pubs: [pubWithUser('p1', 'u1')],
			options: OPTIONS,
			renderReleaseHtml,
			fetchAsset,
		});

		const html = payload.files.find((f) => f.contentType.startsWith('text/html'));
		const png = payload.files.find((f) => f.contentType === 'image/png');
		expect(html?.fileName).toBe('p1-v1.html');
		expect(png?.fileName).toBe('photo.png');

		const release = payload.records.find((r) => r.type === 'Release')!;
		expect(release.data.contentFile).toMatchObject({
			fileName: 'p1-v1.html',
			mimeType: 'text/html',
		});
		expect(release.data.assets).toEqual([
			expect.objectContaining({ fileName: 'photo.png', mimeType: 'image/png' }),
		]);
		// No hardcoded octet-stream for a known type.
		expect(png?.contentType).not.toBe('application/octet-stream');
	});
});

describe('underlay/mapping — determinism', () => {
	it('produces an identical manifest across runs (no volatile fields)', async () => {
		const build = () =>
			buildUnderlayPush({
				community,
				collections: [],
				pubs: [pubWithUser('p1', 'u1'), pubWithUser('p2', 'u1')],
				options: OPTIONS,
				renderReleaseHtml,
				fetchAsset,
			});
		const a = buildManifest((await build()).records);
		const b = buildManifest((await build()).records);
		expect(a).toEqual(b);
		// Every record re-hashes to its manifest entry.
		const payload = await build();
		for (const record of payload.records) {
			const entry = payload.manifest ?? buildManifest(payload.records);
			const m = entry.find((e) => e.id === record.id && e.type === record.type)!;
			expect(hashRecord(record).hash).toBe(m.hash);
		}
	});
});

describe('underlay/mapping — asset failures are non-fatal', () => {
	it('skips a failed asset, still emits the Release, and reports a structured warning', async () => {
		const warnings: AssetWarning[] = [];
		const records = await mapPubRecords(pubWithUser('p1', 'u1'), {
			community,
			options: OPTIONS,
			addFile: (bytes, contentType, fileName) => `${contentType}:${fileName}:${bytes.length}`,
			renderReleaseHtml,
			fetchAsset: async (url) => {
				throw new Error(`404 for ${url}`);
			},
			onAssetWarning: (w) => warnings.push(w),
		});

		// The push did not throw; the Release record is still present.
		expect(records.some((r) => r.type === 'Release')).toBe(true);
		expect(warnings).toHaveLength(1);
		expect(warnings[0]).toMatchObject({
			pubId: 'p1',
			assetUrl: 'https://assets.pubpub.org/abc/photo.png',
		});
		expect(warnings[0].reason).toContain('404');
	});
});

describe('underlay/mapping — canonical pub metadata', () => {
	it('emits license (kind + spdx + uri), publishedAt, htmlTitle, and kind', async () => {
		const pub: PubInput = {
			id: 'p1',
			slug: 'p1',
			title: 'Plain Title',
			htmlTitle: '<em>Styled</em> Title',
			createdAt: '2026-01-05T00:00:00.000Z',
			customPublishedAt: '2025-12-01T00:00:00.000Z',
			license: 'cc-by',
			licenseSpdx: 'CC-BY-4.0',
			licenseUri: 'https://creativecommons.org/licenses/by/4.0/',
			kind: 'JournalArticle',
			attributions: [],
			collectionPubs: [],
			releases: [{ id: 'p1-r1', historyKey: 1, createdAt: '2026-01-06T00:00:00.000Z' }],
			outboundEdges: [],
		};
		const payload = await buildUnderlayPush({
			community,
			collections: [],
			pubs: [pub],
			options: OPTIONS,
			renderReleaseHtml,
			fetchAsset,
		});
		const record = payload.records.find((r) => r.type === 'Pub')!;
		expect(record.data).toMatchObject({
			htmlTitle: '<em>Styled</em> Title',
			kind: 'JournalArticle',
			license: 'cc-by',
			licenseSpdx: 'CC-BY-4.0',
			licenseUri: 'https://creativecommons.org/licenses/by/4.0/',
			// customPublishedAt wins over the release/creation dates.
			publishedAt: '2025-12-01T00:00:00.000Z',
		});
	});

	it('emits avatar as $file, htmlDescription, metadata as-is, and labels (id+title only)', async () => {
		const pub: PubInput = {
			id: 'p1',
			slug: 'p1',
			title: 'T',
			htmlDescription: '<em>Styled</em> summary',
			avatar: 'https://assets.pubpub.org/pub-avatar.png',
			metadata: {
				bibcode: '2020ApJ...123..45X',
				mtg_id: 'agu-2020',
				mtg_presentation_id: 'p-9',
			},
			labels: [
				{ id: 'l1', title: 'Featured', color: '#ff0000', publicApply: true } as never,
				{ id: 'l2', title: 'Review', color: '#00ff00', publicApply: false } as never,
			],
			createdAt: '2026-01-05T00:00:00.000Z',
			attributions: [],
			collectionPubs: [],
			releases: [{ id: 'p1-r1', historyKey: 1, createdAt: '2026-01-06T00:00:00.000Z' }],
			outboundEdges: [],
		};
		const payload = await buildUnderlayPush({
			community,
			collections: [],
			pubs: [pub],
			options: OPTIONS,
			renderReleaseHtml,
			fetchAsset,
		});
		const record = payload.records.find((r) => r.type === 'Pub')!;
		expect(record.data.htmlDescription).toBe('<em>Styled</em> summary');
		expect(String((record.data.avatar as Record<string, unknown>).$file)).toMatch(/^sha256:/);
		expect(record.data.metadata).toEqual({
			bibcode: '2020ApJ...123..45X',
			mtg_id: 'agu-2020',
			mtg_presentation_id: 'p-9',
		});
		expect(record.data.labels).toEqual([
			{ id: 'l1', title: 'Featured' },
			{ id: 'l2', title: 'Review' },
		]);
		const firstLabel = (record.data.labels as Record<string, unknown>[])[0];
		expect(firstLabel).not.toHaveProperty('color');
		expect(firstLabel).not.toHaveProperty('publicApply');
		// Secret access tokens + internal FKs must never leak onto the record.
		for (const k of [
			'viewHash',
			'editHash',
			'reviewHash',
			'commentHash',
			'draftId',
			'searchVector',
		]) {
			expect(record.data).not.toHaveProperty(k);
		}
	});

	it('omits the pub avatar and warns when it fails to localize', async () => {
		const warnings: AssetWarning[] = [];
		const pub: PubInput = {
			id: 'p1',
			slug: 'p1',
			title: 'T',
			avatar: 'https://assets.pubpub.org/broken.png',
			createdAt: '2026-01-05T00:00:00.000Z',
			attributions: [],
			collectionPubs: [],
			releases: [],
			outboundEdges: [],
		};
		const records = await mapPubRecords(pub, {
			community,
			options: OPTIONS,
			addFile: (bytes, contentType, fileName) => `${contentType}:${fileName}:${bytes.length}`,
			renderReleaseHtml,
			fetchAsset: async () => {
				throw new Error('boom');
			},
			onAssetWarning: (w) => warnings.push(w),
		});
		const record = records.find((r) => r.type === 'Pub')!;
		expect(record.data).not.toHaveProperty('avatar');
		expect(warnings.some((w) => w.assetUrl === 'https://assets.pubpub.org/broken.png')).toBe(
			true,
		);
	});

	it('falls back publishedAt to the earliest release, then pub.createdAt', async () => {
		const base: PubInput = {
			id: 'p1',
			slug: 'p1',
			title: 'T',
			createdAt: '2026-03-01T00:00:00.000Z',
			attributions: [],
			collectionPubs: [],
			releases: [{ id: 'p1-r1', historyKey: 1, createdAt: '2026-02-01T00:00:00.000Z' }],
			outboundEdges: [],
		};
		const withRelease = await buildUnderlayPush({
			community,
			collections: [],
			pubs: [base],
			options: OPTIONS,
			renderReleaseHtml,
			fetchAsset,
		});
		expect(withRelease.records.find((r) => r.type === 'Pub')!.data.publishedAt).toBe(
			'2026-02-01T00:00:00.000Z',
		);

		const noRelease = await buildUnderlayPush({
			community,
			collections: [],
			pubs: [{ ...base, releases: [] }],
			options: OPTIONS,
			renderReleaseHtml,
			fetchAsset,
		});
		expect(noRelease.records.find((r) => r.type === 'Pub')!.data.publishedAt).toBe(
			'2026-03-01T00:00:00.000Z',
		);
	});
});

describe('underlay/mapping — self-contained HTML', () => {
	it('rewrites in-body asset URLs to content-addressed refs; contentFile has no external URLs', async () => {
		const payload = await buildUnderlayPush({
			community,
			collections: [],
			pubs: [pubWithUser('p1', 'u1')],
			options: OPTIONS,
			renderReleaseHtml,
			fetchAsset,
		});

		const htmlFile = payload.files.find((f) => f.contentType.startsWith('text/html'))!;
		const content = htmlFile.bytes.toString('utf8');
		expect(content).not.toContain('assets.pubpub.org');
		expect(content).toContain('sha256:');

		const release = payload.records.find((r) => r.type === 'Release')!;
		const asset = (release.data.assets as Record<string, unknown>[])[0];
		expect(String(asset.$file)).toMatch(/^sha256:/);
		// Provenance lives on the structured reference, not in the HTML.
		expect(asset.originalUrl).toBe('https://assets.pubpub.org/abc/photo.png');
		// The rewritten sha256 ref in the HTML resolves to a file in the push.
		const referencedHash = String(asset.$file).replace('sha256:', '');
		expect(content).toContain(`sha256:${referencedHash}`);
		expect(payload.files.some((f) => f.hash === referencedHash)).toBe(true);
	});
});

describe('underlay/mapping — responsive srcSet rewrite', () => {
	const base = 'https://assets.pubpub.org/abc/photo.png';
	// PubPub emits a plain src plus a responsive srcset of Fastly dpr variants, and a data-url.
	const renderResponsive = async () =>
		`<p>Body</p><img src="${base}" ` +
		`srcset="${base}?width=800 1x, ${base}?width=800&amp;dpr=2 2x, ${base}?width=800&amp;dpr=3 3x" ` +
		`sizes="100vw" data-url="${base}" />`;

	const runPush = () =>
		buildUnderlayPush({
			community,
			collections: [],
			pubs: [pubWithUser('p1', 'u1')],
			options: OPTIONS,
			renderReleaseHtml: renderResponsive,
			fetchAsset,
		});

	const contentOf = (payload: Awaited<ReturnType<typeof runPush>>) =>
		payload.files.find((f) => f.contentType.startsWith('text/html'))!.bytes.toString('utf8');

	it('rewrites every srcSet candidate as a whole token, drops srcset/sizes, and leaves no glued tokens or external URLs', async () => {
		const html = contentOf(await runPush());
		// Zero external URLs anywhere — src, former srcset candidates, and data-url.
		expect(html).not.toContain('assets.pubpub.org');
		// No glued remnants like `sha256:<hash>&dpr=2` / `&amp;dpr=2`.
		expect(html).not.toMatch(/sha256:[a-f0-9]+(?:&amp;|&)?(?:dpr|width)=/);
		// CDN responsive variants stripped from the canonical HTML.
		expect(html).not.toMatch(/srcset=/i);
		expect(html).not.toMatch(/\bsizes=/i);
		// The single content-addressed src remains.
		expect(html).toMatch(/src="sha256:[a-f0-9]+"/);
	});

	it('is deterministic across runs (identical contentFile ref)', async () => {
		const [a, b] = await Promise.all([runPush(), runPush()]);
		const ref = (p: Awaited<ReturnType<typeof runPush>>) =>
			p.records.find((r) => r.type === 'Release')!.data.contentFile;
		expect(ref(a)).toEqual(ref(b));
	});
});

describe('underlay/mapping — asset URLs with spaces/parens in the filename', () => {
	// Real prod URLs have literal spaces (and occasionally parens) in the filename. A
	// whitespace-bounded matcher truncated at the first space, leaving the full external URL in the
	// canonical HTML. Attribute-value-aware capture must grab the whole quoted value.
	const spaced = 'https://assets.pubpub.org/x/My Figure 1-123.png?width=800&fit=bounds';
	const parened = 'https://assets.pubpub.org/y/Figure (final)-456.png';
	const renderSpaced = async () => `<p>Body</p><img src="${spaced}" /><img src="${parened}" />`;
	// Distinct bytes per URL so the two images don't dedupe to one hash.
	const fetchDistinct = async (url: string) => Buffer.from(`bytes:${url}`);

	const runPush = () =>
		buildUnderlayPush({
			community,
			collections: [],
			pubs: [pubWithUser('p1', 'u1')],
			options: OPTIONS,
			renderReleaseHtml: renderSpaced,
			fetchAsset: fetchDistinct,
		});

	it('localizes spaced/paren’d URLs and leaves zero external URLs in the contentFile', async () => {
		const payload = await runPush();
		const html = payload.files
			.find((f) => f.contentType.startsWith('text/html'))!
			.bytes.toString('utf8');
		// The whole quoted value (spaces + parens) was captured and rewritten — nothing external left.
		expect(html).not.toContain('assets.pubpub.org');
		expect(html.match(/src="sha256:[a-f0-9]+"/g) ?? []).toHaveLength(2);

		const release = payload.records.find((r) => r.type === 'Release')!;
		const assets = release.data.assets as Record<string, unknown>[];
		// Both distinct images localized; each resolves to a file in the push.
		expect(assets).toHaveLength(2);
		for (const a of assets) {
			const hash = String(a.$file).replace('sha256:', '');
			expect(payload.files.some((f) => f.hash === hash)).toBe(true);
		}
	});
});

describe('underlay/mapping — branding/avatar images become files', () => {
	const brandedCommunity: CommunityInput = {
		id: 'c1',
		subdomain: 'sub',
		title: 'Community One',
		avatar: 'https://assets.pubpub.org/logo.png',
		accentColorLight: '#ffffff',
		twitter: 'https://twitter.com/kf',
	};
	const brandedCollection: CollectionInput = {
		id: 'col1',
		title: 'Issue 1',
		avatar: 'https://assets.pubpub.org/col.png',
	};
	const pubWithAvatarAuthor: PubInput = {
		id: 'p1',
		slug: 'p1',
		title: 'T',
		createdAt: '2026-01-01T00:00:00.000Z',
		attributions: [
			{
				id: 'a1',
				userId: 'u1',
				name: 'Ada',
				avatar: 'https://assets.pubpub.org/ada.png',
				order: 0,
			},
		],
		collectionPubs: [],
		releases: [{ id: 'p1-r1', historyKey: 1, createdAt: '2026-01-02T00:00:00.000Z' }],
		outboundEdges: [],
	};

	it('localizes Community/Collection/User images to $file refs and keeps scalar branding', async () => {
		const payload = await buildUnderlayPush({
			community: brandedCommunity,
			collections: [brandedCollection],
			pubs: [pubWithAvatarAuthor],
			options: OPTIONS,
			renderReleaseHtml,
			fetchAsset,
		});
		const comm = payload.records.find((r) => r.type === 'Community')!;
		expect(comm.data.avatar).toMatchObject({
			originalUrl: 'https://assets.pubpub.org/logo.png',
		});
		expect(String((comm.data.avatar as Record<string, unknown>).$file)).toMatch(/^sha256:/);
		expect(comm.data.accentColorLight).toBe('#ffffff');
		expect(comm.data.twitter).toBe('https://twitter.com/kf');

		const coll = payload.records.find((r) => r.type === 'Collection')!;
		expect(String((coll.data.avatar as Record<string, unknown>).$file)).toMatch(/^sha256:/);

		const user = payload.records.find((r) => r.type === 'User')!;
		expect(String((user.data.avatar as Record<string, unknown>).$file)).toMatch(/^sha256:/);
	});

	it('omits the image field and warns when a branding image fails to localize', async () => {
		const warnings: AssetWarning[] = [];
		const records = await mapCommunityScopeRecords(brandedCommunity, [], [], {
			addFile: (_b, _c, f) => `hash-${f}`,
			fetchAsset: async () => {
				throw new Error('boom');
			},
			onAssetWarning: (w) => warnings.push(w),
			options: OPTIONS,
		});
		const comm = records.find((r) => r.type === 'Community')!;
		expect(comm.data).not.toHaveProperty('avatar');
		// Scalars still present.
		expect(comm.data.accentColorLight).toBe('#ffffff');
		expect(warnings.some((w) => w.assetUrl === 'https://assets.pubpub.org/logo.png')).toBe(
			true,
		);
	});
});

describe('underlay/mapping — immutable asset url→hash cache', () => {
	const url = 'https://assets.pubpub.org/logo.png';
	const brandedCommunity: CommunityInput = {
		id: 'c1',
		subdomain: 'sub',
		title: 'Community One',
		avatar: url,
	};
	const emptyCache = (): AssetCacheContext => ({
		preloaded: new Map(),
		learned: new Map(),
		byHash: new Map(),
	});

	it('references a preloaded scope image without downloading it', async () => {
		let fetchCalls = 0;
		const cachedHashes: string[] = [];
		const assetCache: AssetCacheContext = {
			preloaded: new Map([
				[url, { hash: 'cachedhash123', fileName: 'logo.png', mimeType: 'image/png' }],
			]),
			learned: new Map(),
			byHash: new Map(),
		};
		const records = await mapCommunityScopeRecords(brandedCommunity, [], [], {
			addFile: () => {
				throw new Error('a cached asset must not be added with bytes');
			},
			fetchAsset: async () => {
				fetchCalls += 1;
				return Buffer.from('should-not-run');
			},
			options: OPTIONS,
			assetCache,
			registerCachedHash: (h) => cachedHashes.push(h),
		});

		expect(fetchCalls).toBe(0);
		const comm = records.find((r) => r.type === 'Community')!;
		expect(comm.data.avatar).toMatchObject({
			$file: 'sha256:cachedhash123',
			fileName: 'logo.png',
			mimeType: 'image/png',
			originalUrl: url,
		});
		expect(cachedHashes).toContain('cachedhash123');
		// The reverse map is populated so the client can fetch the bytes lazily if the server needs them.
		expect(assetCache.byHash.get('cachedhash123')).toMatchObject({ url });
	});

	it('fetches on a cache miss and records the learned mapping (for later persistence)', async () => {
		const assetCache = emptyCache();
		const records = await mapCommunityScopeRecords(brandedCommunity, [], [], {
			addFile: (bytes) => `hash-${bytes.length}`,
			fetchAsset: async () => Buffer.from('imagebytes'), // 10 bytes → hash-10
			options: OPTIONS,
			assetCache,
			registerCachedHash: () => {
				throw new Error('a freshly-fetched asset is not a cache hit');
			},
		});
		const comm = records.find((r) => r.type === 'Community')!;
		expect(String((comm.data.avatar as Record<string, unknown>).$file)).toBe('sha256:hash-10');
		expect(assetCache.learned.get(url)).toMatchObject({ hash: 'hash-10' });
		expect(assetCache.byHash.get('hash-10')).toMatchObject({ url });
	});

	it('never caches a non-assets.pubpub.org URL (always fetched, never learned)', async () => {
		let fetchCalls = 0;
		const assetCache = emptyCache();
		await mapCommunityScopeRecords(
			{ id: 'c1', subdomain: 's', title: 'C', avatar: 'https://cdn.example.com/a.png' },
			[],
			[],
			{
				addFile: (bytes) => `h-${bytes.length}`,
				fetchAsset: async () => {
					fetchCalls += 1;
					return Buffer.from('z');
				},
				options: OPTIONS,
				assetCache,
				registerCachedHash: () => {},
			},
		);
		expect(fetchCalls).toBe(1);
		expect(assetCache.learned.size).toBe(0);
		expect(assetCache.byHash.size).toBe(0);
	});
});

describe('underlay/mapping — missing release doc is skipped, not published empty', () => {
	const twoReleasePub: PubInput = {
		id: 'p1',
		slug: 'p1',
		title: 'Pub p1',
		createdAt: '2026-01-01T00:00:00.000Z',
		attributions: [],
		collectionPubs: [],
		releases: [
			{ id: 'p1-r1', historyKey: 1, createdAt: '2026-01-02T00:00:00.000Z' },
			{ id: 'p1-r2', historyKey: 2, createdAt: '2026-01-03T00:00:00.000Z' },
		],
		outboundEdges: [],
	};

	const ctxFor = (
		render: (c: { pub: PubInput; release: { id: string } }) => Promise<string | null>,
		warnings: AssetWarning[],
	) => ({
		community,
		options: { includeReleaseHtml: true, includeAssets: false, exportFormats: [] },
		addFile: (bytes: Buffer, contentType: string, fileName?: string) =>
			`${contentType}:${fileName}:${bytes.length}`,
		renderReleaseHtml: render as (c: {
			pub: PubInput;
			release: { id: string; historyKey: number; createdAt: string | Date };
		}) => Promise<string | null>,
		onAssetWarning: (w: AssetWarning) => warnings.push(w),
	});

	it('skips the release with a missing doc, warns, and points latestReleaseId at the newest EMITTED release', async () => {
		const warnings: AssetWarning[] = [];
		// The latest release (r2) has no loadable doc → null; r1 renders normally.
		const render = async ({ release }: { release: { id: string } }) =>
			release.id === 'p1-r2' ? null : '<p>Body</p>';
		const records = await mapPubRecords(twoReleasePub, ctxFor(render, warnings));

		const releaseIds = records.filter((r) => r.type === 'Release').map((r) => r.id);
		expect(releaseIds).toEqual(['p1-r1']); // r2 skipped
		const pub = records.find((r) => r.type === 'Pub')!;
		expect(pub.data.latestReleaseId).toBe('p1-r1'); // newest EMITTED, not the skipped r2

		expect(warnings).toHaveLength(1);
		expect(warnings[0].pubId).toBe('p1');
		expect(warnings[0].assetUrl).toBeUndefined();
		expect(warnings[0].reason).toContain('p1-r2');
		expect(warnings[0].reason).toContain('unavailable');
	});

	it('omits latestReleaseId entirely when every release is skipped', async () => {
		const warnings: AssetWarning[] = [];
		const render = async () => null; // all docs missing
		const records = await mapPubRecords(twoReleasePub, ctxFor(render, warnings));

		expect(records.some((r) => r.type === 'Release')).toBe(false);
		const pub = records.find((r) => r.type === 'Pub')!;
		expect('latestReleaseId' in pub.data).toBe(false);
		expect(warnings).toHaveLength(2);
	});

	it('is deterministic — the same missing-doc input yields the same records', async () => {
		const render = async ({ release }: { release: { id: string } }) =>
			release.id === 'p1-r2' ? null : '<p>Body</p>';
		const a = await mapPubRecords(twoReleasePub, ctxFor(render, []));
		const b = await mapPubRecords(twoReleasePub, ctxFor(render, []));
		expect(JSON.stringify(a)).toBe(JSON.stringify(b));
	});
});

describe('underlay/mapping — push signature is schema-key-order independent', () => {
	it('yields the same signature when a schema object’s keys are reordered', () => {
		const manifest = [{ id: 'p1', type: 'Pub', hash: 'abc' }];
		const files: string[] = ['f1'];
		const sigA = computeSignatureFromParts(manifest, files, {
			Pub: { type: 'object', properties: { a: { type: 'string' }, b: { type: 'number' } } },
		});
		// Same schema, keys emitted in a different order — canonicalization must collapse them.
		const sigB = computeSignatureFromParts(manifest, files, {
			Pub: { properties: { b: { type: 'number' }, a: { type: 'string' } }, type: 'object' },
		});
		expect(sigA).toBe(sigB);
	});
});

describe('underlay/mapping — push signature includes version metadata (readme)', () => {
	const manifest = [{ id: 'p1', type: 'Pub', hash: 'abc' }];
	const files = ['f1'];
	const schemas = { Pub: { type: 'object', properties: { a: { type: 'string' } } } };

	it('changes the signature when metadata (readme) changes — so a readme-only edit is not skipped', () => {
		const sigOld = computeSignatureFromParts(manifest, files, schemas, {
			readme: 'Old readme',
		});
		const sigNew = computeSignatureFromParts(manifest, files, schemas, {
			readme: 'New readme',
		});
		expect(sigOld).not.toBe(sigNew);
	});

	it('is stable for identical metadata (still a true no-op) and key-order independent', () => {
		const a = computeSignatureFromParts(manifest, files, schemas, {
			license: 'cc',
			readme: 'R',
		});
		// Same values, different runtime insertion order — canonicalization must collapse them.
		const reordered: Record<string, string> = {};
		reordered.readme = 'R';
		reordered.license = 'cc';
		const b = computeSignatureFromParts(manifest, files, schemas, reordered);
		expect(a).toBe(b);
	});
});

describe('underlay/mapping — downloadable exports (Release.exports)', () => {
	const pubWithExports: PubInput = {
		id: 'pe',
		slug: 'my-article',
		title: 'Exported',
		createdAt: '2026-01-01T00:00:00.000Z',
		attributions: [],
		collectionPubs: [],
		releases: [{ id: 'pe-r1', historyKey: 3, createdAt: '2026-01-02T00:00:00.000Z' }],
		outboundEdges: [],
		exports: [
			{ format: 'pdf', url: 'https://assets.pubpub.org/x/a.pdf', historyKey: 3 },
			{ format: 'epub', url: 'https://assets.pubpub.org/x/a.epub', historyKey: 3 },
			{ format: 'docx', url: 'https://assets.pubpub.org/x/a.docx', historyKey: 3 },
			// url:null → skipped; wrong historyKey → not this release.
			{ format: 'jats', url: null as unknown as string, historyKey: 3 },
			{ format: 'pdf', url: 'https://assets.pubpub.org/x/old.pdf', historyKey: 2 },
		],
	};

	const exportCtx = (formats: string[]) => ({
		community,
		options: { includeReleaseHtml: false, includeAssets: false, exportFormats: formats },
		addFile: (_b: Buffer, contentType: string, fileName?: string) =>
			`hash-${fileName}-${contentType.split('/')[1]}`,
		renderReleaseHtml: async () => null,
		fetchAsset,
	});

	it('emits only selected formats for the matching release, skipping url:null and other historyKeys', async () => {
		const records = await mapPubRecords(pubWithExports, exportCtx(['pdf', 'epub']));
		const release = records.find((r) => r.type === 'Release' && r.id === 'pe-r1')!;
		const exports = release.data.exports as {
			format: string;
			$file: string;
			mimeType: string;
		}[];
		expect(exports.map((e) => e.format)).toEqual(['epub', 'pdf']); // sorted, docx excluded
		const pdf = exports.find((e) => e.format === 'pdf')!;
		expect(pdf.mimeType).toBe('application/pdf');
		expect(pdf.$file).toMatch(/^sha256:/);
		const epub = exports.find((e) => e.format === 'epub')!;
		expect(epub.mimeType).toBe('application/epub+zip');
	});

	it('omits exports when no formats are selected', async () => {
		const records = await mapPubRecords(pubWithExports, exportCtx([]));
		const release = records.find((r) => r.type === 'Release' && r.id === 'pe-r1')!;
		expect(release.data).not.toHaveProperty('exports');
	});

	it('is deterministic — same input yields identical Release.exports', async () => {
		const a = await mapPubRecords(pubWithExports, exportCtx(['pdf', 'epub']));
		const b = await mapPubRecords(pubWithExports, exportCtx(['pdf', 'epub']));
		const ra = a.find((r) => r.type === 'Release')!;
		const rb = b.find((r) => r.type === 'Release')!;
		expect(hashRecord(ra)).toEqual(hashRecord(rb));
	});
});

describe('underlay/mapping — formatted downloads (Pub.downloads)', () => {
	const formattedUrl = 'https://assets.pubpub.org/44k2vnvm/61595701771772.pdf';
	const pubWithDownloads: PubInput = {
		id: 'pd',
		slug: 'ragworms-commentary',
		title: 'Ragworms',
		createdAt: '2026-01-01T00:00:00.000Z',
		attributions: [],
		collectionPubs: [],
		releases: [{ id: 'pd-r1', historyKey: 1, createdAt: '2026-01-02T00:00:00.000Z' }],
		outboundEdges: [],
		downloads: [
			{ type: 'formatted', url: formattedUrl, createdAt: '2026-02-01T10:00:00.000Z' },
			{
				type: 'formatted',
				url: 'https://assets.pubpub.org/44k2vnvm/older.pdf',
				createdAt: '2025-12-01T10:00:00.000Z',
			},
			// Not a formatted download, and one without a url: both ignored.
			{ type: 'other', url: 'https://assets.pubpub.org/x/other.pdf', createdAt: null },
			{ type: 'formatted', url: null, createdAt: '2026-03-01T00:00:00.000Z' },
		],
	};

	const ctx = (options: PushOptions, fetch = fetchAsset, warnings: AssetWarning[] = []) => ({
		community,
		options,
		addFile: (bytes: Buffer) => `hash-of-${bytes.toString()}`,
		renderReleaseHtml: async () => null,
		fetchAsset: fetch,
		onAssetWarning: (w: AssetWarning) => warnings.push(w),
	});

	const assetsOnly: PushOptions = {
		includeReleaseHtml: false,
		includeAssets: true,
		exportFormats: [],
	};

	it('emits formatted downloads as file references on the Pub, oldest first', async () => {
		const records = await mapPubRecords(
			pubWithDownloads,
			ctx(assetsOnly, async (url) => Buffer.from(url)),
		);
		const pub = records.find((r) => r.type === 'Pub')!;
		expect(pub.data.downloads).toEqual([
			{
				type: 'formatted',
				createdAt: '2025-12-01T10:00:00.000Z',
				$file: 'sha256:hash-of-https://assets.pubpub.org/44k2vnvm/older.pdf',
				fileName: 'ragworms-commentary.pdf',
				mimeType: 'application/pdf',
				originalUrl: 'https://assets.pubpub.org/44k2vnvm/older.pdf',
			},
			{
				type: 'formatted',
				createdAt: '2026-02-01T10:00:00.000Z',
				$file: `sha256:hash-of-${formattedUrl}`,
				fileName: 'ragworms-commentary.pdf',
				mimeType: 'application/pdf',
				originalUrl: formattedUrl,
			},
		]);
		// Not duplicated onto the release.
		const release = records.find((r) => r.type === 'Release')!;
		expect(release.data).not.toHaveProperty('downloads');
	});

	it('omits downloads when assets are excluded', async () => {
		const records = await mapPubRecords(
			pubWithDownloads,
			ctx({ ...assetsOnly, includeAssets: false }),
		);
		expect(records.find((r) => r.type === 'Pub')!.data).not.toHaveProperty('downloads');
	});

	it('skips a download that fails to fetch, with a warning', async () => {
		const warnings: AssetWarning[] = [];
		const records = await mapPubRecords(
			pubWithDownloads,
			ctx(
				assetsOnly,
				async (url) => {
					if (url === formattedUrl) {
						throw new Error('403');
					}
					return Buffer.from(url);
				},
				warnings,
			),
		);
		const downloads = records.find((r) => r.type === 'Pub')!.data.downloads as {
			originalUrl: string;
		}[];
		expect(downloads.map((d) => d.originalUrl)).toEqual([
			'https://assets.pubpub.org/44k2vnvm/older.pdf',
		]);
		expect(warnings).toEqual([{ pubId: 'pd', assetUrl: formattedUrl, reason: '403' }]);
	});

	it('omits downloads when the pub has none', async () => {
		const records = await mapPubRecords(
			{ ...pubWithDownloads, downloads: null },
			ctx(assetsOnly),
		);
		expect(records.find((r) => r.type === 'Pub')!.data).not.toHaveProperty('downloads');
	});
});

describe('underlay/mapping — collection metadata and order', () => {
	const issue: CollectionInput = {
		id: 'col-issue',
		title: 'Volume 4, Issue 1',
		slug: 'v4i1',
		kind: 'issue',
		doi: '10.36850/i1',
		isPublic: true,
		createdAt: '2024-03-01T12:00:00.000Z',
		metadata: {
			volume: '4',
			issue: '1',
			electronicIssn: '2667-1204',
			publicationDate: '2024-03-15T00:00:00.000Z',
			printIssn: '',
			printPublicationDate: null,
		},
	};
	const emptyTag: CollectionInput = { id: 'col-tag', title: 'Empty', kind: 'tag', metadata: {} };
	const member = (id: string, rank: string): PubInput => ({
		...pubWithUser(id, `u-${id}`),
		collectionPubs: [{ collectionId: 'col-issue', rank }],
	});

	const scope = (collections: CollectionInput[], pubs: PubInput[]) =>
		mapCommunityScopeRecords(community, collections, pubs, {
			addFile: () => 'h',
			options: OPTIONS,
		});

	it('emits metadata without empty values, createdAt, and pubIds in rank order', async () => {
		const records = await scope(
			[issue, emptyTag],
			// Deliberately out of order; 'i' < 'r' < 'x' as base36 ranks.
			[member('p-third', 'x'), member('p-first', 'i'), member('p-second', 'r')],
		);
		const record = records.find((r) => r.id === 'col-issue')!;
		expect(record.data).toEqual({
			title: 'Volume 4, Issue 1',
			slug: 'v4i1',
			kind: 'issue',
			doi: '10.36850/i1',
			isPublic: true,
			metadata: {
				volume: '4',
				issue: '1',
				electronicIssn: '2667-1204',
				publicationDate: '2024-03-15T00:00:00.000Z',
			},
			createdAt: '2024-03-01T12:00:00.000Z',
			communityId: 'c1',
			pubIds: ['p-first', 'p-second', 'p-third'],
		});

		// A collection with no exported pubs and empty metadata still lists its (empty) order.
		const tag = records.find((r) => r.id === 'col-tag')!;
		expect(tag.data).not.toHaveProperty('metadata');
		expect(tag.data.pubIds).toEqual([]);
	});

	it('orders by code point, not locale, and is independent of pub input order', async () => {
		const pubs = [member('a', '0z'), member('b', '0Z'), member('c', '01')];
		const forward = await scope([issue], pubs);
		const reversed = await scope([issue], [...pubs].reverse());
		const ids = forward.find((r) => r.id === 'col-issue')!.data.pubIds;
		expect(ids).toEqual(['c', 'b', 'a']);
		expect(hashRecord(forward.find((r) => r.id === 'col-issue')!)).toEqual(
			hashRecord(reversed.find((r) => r.id === 'col-issue')!),
		);
	});

	it('changes the Collection record (only) when the collection is reordered', async () => {
		const before = await scope([issue], [member('p1', 'i'), member('p2', 'r')]);
		const after = await scope([issue], [member('p1', 's'), member('p2', 'r')]);
		const hashOf = (records: typeof before, id: string) =>
			hashRecord(records.find((r) => r.id === id)!).hash;
		expect(hashOf(after, 'col-issue')).not.toBe(hashOf(before, 'col-issue'));
		expect(after.find((r) => r.id === 'col-issue')!.data.pubIds).toEqual(['p2', 'p1']);
	});
});

describe('underlay/mapping — emitted fields match the declared schemas', () => {
	type Schema = { properties?: Record<string, Schema>; items?: Schema; type?: string };

	/** Every key in `value` must be declared by `schema`, recursively into objects and arrays. */
	const undeclared = (value: unknown, schema: Schema, path: string): string[] => {
		if (Array.isArray(value)) {
			return schema.items
				? value.flatMap((v, i) => undeclared(v, schema.items!, `${path}[${i}]`))
				: [];
		}
		if (value && typeof value === 'object' && schema.properties) {
			return Object.entries(value).flatMap(([key, v]) =>
				schema.properties![key]
					? undeclared(v, schema.properties![key], `${path}.${key}`)
					: [`${path}.${key}`],
			);
		}
		return [];
	};

	it('declares every field of every record type, including nested file references', async () => {
		const pub: PubInput = {
			...pubWithUser('p1', 'u1'),
			avatar: 'https://assets.pubpub.org/x/avatar.png',
			collectionPubs: [{ collectionId: 'col1', rank: 'i' }],
			downloads: [
				{
					type: 'formatted',
					url: 'https://assets.pubpub.org/x/typeset.pdf',
					createdAt: '2026-02-01T00:00:00.000Z',
				},
			],
			exports: [{ format: 'pdf', url: 'https://assets.pubpub.org/x/a.pdf', historyKey: 1 }],
		};
		const payload = await buildUnderlayPush({
			community: { ...community, avatar: 'https://assets.pubpub.org/x/logo.png' },
			collections: [
				{
					id: 'col1',
					title: 'Issue',
					kind: 'issue',
					avatar: 'https://assets.pubpub.org/x/col.png',
					metadata: { volume: '1' },
					createdAt: '2026-01-01T00:00:00.000Z',
					layoutBlocks: [
						{
							id: 'i1',
							type: 'text',
							html: '<img src="https://assets.pubpub.org/x/j.png"/>',
						},
					],
				},
			],
			pubs: [pub],
			pages: [
				{
					id: 'page1',
					title: 'About',
					slug: 'about',
					description: 'Who we are',
					avatar: 'https://assets.pubpub.org/x/page.png',
					isPublic: true,
					createdAt: '2026-01-01T00:00:00.000Z',
					updatedAt: '2026-01-02T00:00:00.000Z',
					blocks: [
						{
							id: 'b1',
							type: 'text',
							html: '<img src="https://assets.pubpub.org/x/i.png"/>',
						},
						{ id: 'b2', type: 'pubs', title: 'Latest' },
					],
				},
			],
			options: { ...OPTIONS, exportFormats: ['pdf'] },
			renderReleaseHtml,
			fetchAsset,
		});
		const types = new Set(payload.records.map((r) => r.type));
		expect(types).toEqual(
			new Set([
				'Community',
				'Collection',
				'Page',
				'User',
				'PubAttribution',
				'Pub',
				'Release',
			]),
		);
		const problems = payload.records.flatMap((r) =>
			undeclared(r.data, payload.schemas[r.type] as Schema, `${r.type}:${r.id}`),
		);
		expect(problems).toEqual([]);
		const pubRecord = payload.records.find((r) => r.type === 'Pub')!;
		expect(pubRecord.data.downloads).toHaveLength(1);
		expect(payload.records.find((r) => r.type === 'Collection')!.data.pubIds).toEqual(['p1']);
	});
});

describe('underlay/mapping — Pages and collection layout text', () => {
	const urlFetch = async (url: string) => Buffer.from(url);
	const scope = (
		collections: CollectionInput[],
		pages: PageInput[],
		options: PushOptions = OPTIONS,
	) =>
		mapCommunityScopeRecords(
			community,
			collections,
			[],
			{
				addFile: (bytes) => `h-${bytes.toString().split('/').pop()}`,
				fetchAsset: urlFetch,
				options,
			},
			pages,
		);

	const about: PageInput = {
		id: 'pg-about',
		title: 'About',
		slug: 'about',
		description: 'About the journal',
		isPublic: true,
		createdAt: '2020-01-01T00:00:00.000Z',
		updatedAt: '2024-05-01T00:00:00.000Z',
		blocks: [
			{ id: 'b0', type: 'banner' },
			{
				id: 'b1',
				type: 'text',
				html: '<h2>About</h2><img srcSet="x 1x" src="https://assets.pubpub.org/a/team.png?width=800&amp;fit=bounds"/>',
			},
			{ id: 'b2', type: 'pubs', title: 'Latest' },
			{ id: 'b3', type: 'html', html: '<p>Contact us</p>' },
			{ id: 'b4', type: 'text', html: '' },
		],
	};

	it('exports a public page with blocks in layout order, joined html, and localized images', async () => {
		const records = await scope([], [about]);
		const page = records.find((r) => r.type === 'Page')!;
		expect(page).toEqual({
			id: 'pg-about',
			type: 'Page',
			data: {
				title: 'About',
				slug: 'about',
				description: 'About the journal',
				isPublic: true,
				communityId: 'c1',
				createdAt: '2020-01-01T00:00:00.000Z',
				updatedAt: '2024-05-01T00:00:00.000Z',
				html: '<h2>About</h2><img src="sha256:h-team.png"/>\n<p>Contact us</p>',
				blocks: [
					{ id: 'b0', type: 'banner' },
					{
						id: 'b1',
						type: 'text',
						html: '<h2>About</h2><img src="sha256:h-team.png"/>',
					},
					{ id: 'b2', type: 'pubs', title: 'Latest' },
					{ id: 'b3', type: 'html', html: '<p>Contact us</p>' },
					{ id: 'b4', type: 'text' },
				],
				assets: [
					{
						$file: 'sha256:h-team.png',
						fileName: 'team.png',
						mimeType: 'image/png',
						originalUrl: 'https://assets.pubpub.org/a/team.png',
					},
				],
			},
		});
	});

	it('keeps original image URLs when assets are excluded', async () => {
		const records = await scope([], [about], { ...OPTIONS, includeAssets: false });
		const page = records.find((r) => r.type === 'Page')!;
		expect(page.data.html).toContain('https://assets.pubpub.org/a/team.png');
		expect(page.data).not.toHaveProperty('assets');
	});

	it('exports the home page (slug "") but no private page', async () => {
		const records = await scope(
			[],
			[
				{ ...about, id: 'pg-home', slug: '', title: 'Home' },
				{ ...about, id: 'pg-draft', slug: 'draft', isPublic: false },
				{ ...about, id: 'pg-unset', slug: 'unset', isPublic: null },
			],
		);
		expect(records.filter((r) => r.type === 'Page').map((r) => [r.id, r.data.slug])).toEqual([
			['pg-home', ''],
		]);
	});

	it('gives a public collection layoutHtml and layoutBlocks from its layout, and no text when empty or private', async () => {
		const withIntro: CollectionInput = {
			id: 'col-a',
			title: 'Issue 1',
			isPublic: true,
			layoutBlocks: [
				{ id: 'h', type: 'collection-header' },
				{ id: 't', type: 'text', html: '<p>Editorial intro</p>' },
				{ id: 'p', type: 'pubs', title: 'Articles' },
			],
		};
		const records = await scope(
			[
				withIntro,
				{ ...withIntro, id: 'col-private', isPublic: false },
				{ ...withIntro, id: 'col-empty', layoutBlocks: [{ id: 'p', type: 'pubs' }] },
				{ ...withIntro, id: 'col-none', layoutBlocks: undefined },
			],
			[],
		);
		const byId = new Map(records.map((r) => [r.id, r.data]));
		expect(byId.get('col-a')!.layoutHtml).toBe('<p>Editorial intro</p>');
		expect(byId.get('col-a')).not.toHaveProperty('layoutAssets');
		expect(byId.get('col-a')!.layoutBlocks).toEqual([
			{ id: 'h', type: 'collection-header' },
			{ id: 't', type: 'text', html: '<p>Editorial intro</p>' },
			{ id: 'p', type: 'pubs', title: 'Articles' },
		]);
		expect(byId.get('col-empty')!.layoutBlocks).toEqual([{ id: 'p', type: 'pubs' }]);
		for (const id of ['col-private', 'col-empty', 'col-none']) {
			expect(byId.get(id)).not.toHaveProperty('layoutHtml');
		}
		for (const id of ['col-private', 'col-none']) {
			expect(byId.get(id)).not.toHaveProperty('layoutBlocks');
		}
	});
});
