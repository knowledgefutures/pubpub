import { vi } from 'vitest';

import { login, setup, teardown } from 'stubstub';
import {
	analyticsEventSchema,
	type basePageViewSchema,
	type PageViewPayload,
	type sharedEventPayloadSchema,
} from 'utils/api/schemas/analytics';

const baseTestPayload = {
	type: 'page',
	height: 0,
	width: 0,
	title: 'string',
	locale: 'string',
	os: 'string',
	url: 'http://localhost:9876',
	userAgent: 'string',
	timestamp: Date.now(),
	timezone: 'Europe/Amsterdam',
	isProd: false,
	communityId: 'de3a36ab-26d9-4b76-aaab-f1bffc18b102',
	communityName: 'string',
	communitySubdomain: 'string',
} satisfies Omit<(typeof basePageViewSchema & typeof sharedEventPayloadSchema)['_input'], 'event'>;

type PubPageView = PageViewPayload & { event: 'pub' };
const makeTestPubPageViewPayload = (options?: Partial<PubPageView>) => {
	return {
		event: 'pub',
		pubId: 'de3a36ab-26d9-4b76-aaab-f1bffc18b102',
		pubSlug: 'string',
		pubTitle: 'string',
		release: 'draft',
		...baseTestPayload,
		...options,
	} satisfies PageViewPayload & { event: 'pub' };
};

type PagePageView = PageViewPayload & { event: 'page' };
const makeTestPagePageViewPayload = (options?: Partial<PagePageView>) => {
	return {
		event: 'page',
		pageId: 'de3a36ab-26d9-4b76-aaab-f1bffc18b102',
		pageSlug: 'string',
		pageTitle: 'string',
		...baseTestPayload,
		...options,
	} satisfies PagePageView;
};

type CollectionPageView = PageViewPayload & { event: 'collection' };
const makeTestCollectionPageViewPayload = (options?: Partial<CollectionPageView>) => {
	return {
		event: 'collection',
		collectionId: 'de3a36ab-26d9-4b76-aaab-f1bffc18b102',
		collectionSlug: 'string',
		collectionTitle: 'string',
		collectionKind: 'issue',
		...baseTestPayload,
		...options,
	} satisfies CollectionPageView;
};

type OtherPageView = PageViewPayload & { event: 'other' };
const makeTestOtherPageViewPayload = (options?: Partial<OtherPageView>) => {
	return {
		event: 'other',
		...baseTestPayload,
		...options,
	} satisfies OtherPageView;
};

setup(beforeAll, async () => {
	// mock fetch, we don't actually want to send api calls
	vi.spyOn(global, 'fetch').mockImplementation(
		() =>
			Promise.resolve({
				json: () => Promise.resolve({ status: 'ok', id: 'id' }),
			}) as unknown as Promise<Response>,
	);

	// to be safe, do not actually send any requests to stitch
	process.env.STITCH_WEBHOOK_URL = 'http://localhost:9876';
});

teardown(afterAll, () => {
	vi.restoreAllMocks();
});

describe('analytics schema', () => {
	describe('pub page view', () => {
		it('should only accept draft and number release', () => {
			const pubViewDraft = makeTestPubPageViewPayload({ release: 'draft' });
			const pubViewNumber = makeTestPubPageViewPayload({ release: 1 });

			expect(analyticsEventSchema.safeParse(pubViewDraft)).toBeTruthy();
			expect(analyticsEventSchema.safeParse(pubViewNumber)).toBeTruthy();
		});

		// this is needed otherwise redshift will create two colunms, release__bigint and release__string
		it('should convert number releases into strings', () => {
			const pubViewNumber = makeTestPubPageViewPayload({ release: 1 });
			const parsed = analyticsEventSchema.safeParse(pubViewNumber);
			expect(parsed.success).toBeTruthy();
			if (!parsed.success) {
				throw new Error('parsed failed');
			}
			expect(parsed.data).toEqual({
				...pubViewNumber,
				release: '1',
			});
		});
	});
});

describe('analytics', () => {
	test('pub page view', async () => {
		const payload = makeTestPubPageViewPayload();
		const agent = await login();

		await agent.post('/api/analytics/track').send(payload).expect(204);
	});

	test('page page view', async () => {
		const payload = makeTestPagePageViewPayload();
		const agent = await login();

		await agent.post('/api/analytics/track').send(payload).expect(204);
	});

	test('collection page view', async () => {
		const payload = makeTestCollectionPageViewPayload();
		const agent = await login();

		await agent.post('/api/analytics/track').send(payload).expect(204);
	});

	test('other page view', async () => {
		const payload = makeTestOtherPageViewPayload();
		const agent = await login();

		await agent.post('/api/analytics/track').send(payload).expect(204);
	});

	test('page page view with optional fields', async () => {
		const payload = makeTestPagePageViewPayload();
		const agent = await login();

		await agent.post('/api/analytics/track').send(payload).expect(204);
	});
});
