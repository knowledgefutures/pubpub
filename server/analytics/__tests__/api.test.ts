import { login, setup, teardown } from 'stubstub';
import {
	analyticsEventSchema,
	type basePageViewSchema,
	type PageViewPayload,
	type pageViewSchema,
	type sharedEventPayloadSchema,
} from 'utils/api/schemas/analytics';

import { AnalyticsEvent } from '../model';
import { flush } from '../writeBuffer';

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

/** Full input type (payload + base fields like timestamp/timezone, before Zod transforms) */
type PageViewInput = (typeof pageViewSchema)['_input'];

type PubPageViewInput = PageViewInput & { event: 'pub' };
const makeTestPubPageViewPayload = (options?: Partial<PubPageViewInput>) => {
	return {
		event: 'pub',
		pubId: 'de3a36ab-26d9-4b76-aaab-f1bffc18b102',
		pubSlug: 'string',
		pubTitle: 'string',
		release: 'draft',
		...baseTestPayload,
		...options,
	} satisfies PubPageViewInput;
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

setup(beforeAll, () => undefined);

teardown(afterAll);

describe('analytics schema', () => {
	describe('pub page view', () => {
		it('should only accept draft and number release', () => {
			const pubViewDraft = makeTestPubPageViewPayload({ release: 'draft' });
			const pubViewNumber = makeTestPubPageViewPayload({ release: 1 });

			expect(analyticsEventSchema.safeParse(pubViewDraft)).toBeTruthy();
			expect(analyticsEventSchema.safeParse(pubViewNumber)).toBeTruthy();
		});

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
	afterEach(async () => {
		await AnalyticsEvent.destroy({ where: {} });
	});

	test('pub page view', async () => {
		const payload = makeTestPubPageViewPayload();
		const agent = await login();

		await agent.post('/api/ev').send(payload).expect(204);
		await flush();

		const events = await AnalyticsEvent.findAll({ where: { pubId: payload.pubId } });

		expect(events).toHaveLength(1);
		expect(events[0].event).toBe('pub');
		expect(events[0].pubId).toBe(payload.pubId);
		expect(events[0].release).toBe('draft');
	});

	test('page page view', async () => {
		const payload = makeTestPagePageViewPayload();
		const agent = await login();

		await agent.post('/api/ev').send(payload).expect(204);
		await flush();

		const events = await AnalyticsEvent.findAll({ where: { event: 'page' } });

		expect(events).toHaveLength(1);
		expect(events[0].pageId).toBe(payload.pageId);
	});

	test('collection page view', async () => {
		const payload = makeTestCollectionPageViewPayload();
		const agent = await login();

		await agent.post('/api/ev').send(payload).expect(204);
		await flush();

		const events = await AnalyticsEvent.findAll({
			where: { collectionId: payload.collectionId },
		});

		expect(events).toHaveLength(1);
		expect(events[0].collectionId).toBe(payload.collectionId);
	});

	test('other page view', async () => {
		const payload = makeTestOtherPageViewPayload();
		const agent = await login();

		await agent.post('/api/ev').send(payload).expect(204);
		await flush();

		const events = await AnalyticsEvent.findAll({ where: { event: 'other' } });

		expect(events).toHaveLength(1);
	});

	test('stores timezone from payload', async () => {
		const payload = makeTestPubPageViewPayload({ timezone: 'Europe/Amsterdam' });
		const agent = await login();

		await agent.post('/api/ev').send(payload).expect(204);
		await flush();

		const events = await AnalyticsEvent.findAll({ where: { pubId: payload.pubId } });

		expect(events).toHaveLength(1);
		expect(events[0].timezone).toBe('Europe/Amsterdam');
	});

	test('strips dropped fields (collectionIds, pubSlug, etc.)', async () => {
		const payload = makeTestPubPageViewPayload({
			collectionIds:
				'de3a36ab-26d9-4b76-aaab-f1bffc18b102,ae3a36ab-26d9-4b76-aaab-f1bffc18b103',
		});
		const agent = await login();

		await agent.post('/api/ev').send(payload).expect(204);
		await flush();

		const events = await AnalyticsEvent.findAll({ where: { pubId: payload.pubId } });

		expect(events).toHaveLength(1);
		// Dropped fields should not appear on the model
		expect((events[0] as any).collectionIds).toBeUndefined();
		expect((events[0] as any).pubSlug).toBeUndefined();
	});

	test('converts timestamp to createdAt date', async () => {
		const now = Date.now();
		const payload = makeTestPubPageViewPayload({ timestamp: now });
		const agent = await login();

		await agent.post('/api/ev').send(payload).expect(204);
		await flush();

		const events = await AnalyticsEvent.findAll({ where: { pubId: payload.pubId } });

		expect(events).toHaveLength(1);
		expect(new Date(events[0].createdAt).getTime()).toBe(now);
	});
});
