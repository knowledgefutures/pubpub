import type { Prettify } from 'types/util';

import { z } from 'zod';

export const baseSchema = z.object({
	type: z.enum(['page', 'track']),
	event: z.string(),
	timestamp: z.number(),
	referrer: z.string().nullish(),
	unique: z.boolean().optional(),
	search: z.string().optional(),
	utmSource: z.string().optional(),
	utmMedium: z.string().optional(),
	utmCampaign: z.string().optional(),
	utmTerm: z.string().optional(),
	utmContent: z.string().optional(),
	timezone: z.string(),
	locale: z.string(),
	userAgent: z.string(),
	os: z.string(),
});

/** Information that should always be included in any event payload */
export const sharedEventPayloadSchema = z.object({
	communityId: z.string().uuid(),
	// if it's null, it 'www.pubpub.org'
	communitySubdomain: z.string(),
	communityName: z.string(),
	isProd: z.boolean(),
});

export const basePageViewSchema = baseSchema.merge(
	z.object({
		type: z.literal('page'),
		url: z.string().url(),
		title: z.string(),
		hash: z.string().optional(),
		height: z.number().int(),
		width: z.number().int(),
		path: z.string().optional(),
	}),
);

export const sharedPageViewPayloadSchema = sharedEventPayloadSchema.merge(
	z.object({
		communityId: z.string().uuid().nullable(),
		// if it's null, it 'www.pubpub.org'
		communitySubdomain: z.string().nullable().default('www'),
		communityName: z.string().nullable().default('pubpub'),
		event: z.enum(['page', 'collection', 'pub', 'other']),
	}),
);

// for search, legal, explore, etc
export const otherPageViewPayloadSchema = sharedPageViewPayloadSchema.merge(
	z.object({
		event: z.literal('other'),
	}),
);

export const pagePageViewPayloadSchema = sharedPageViewPayloadSchema.merge(
	z.object({
		event: z.literal('page'),
		pageTitle: z.string(),
		pageId: z.string(),
		pageSlug: z.string(),
	}),
);

export const collectionPageViewPayloadSchema = sharedPageViewPayloadSchema.merge(
	z.object({
		event: z.literal('collection'),
		collectionTitle: z.string(),
		collectionKind: z.enum(['issue', 'conference', 'book', 'tag']),
		collectionId: z.string().uuid(),
		collectionSlug: z.string(),
	}),
);

export const pubPageViewPayloadSchema = sharedPageViewPayloadSchema
	.merge(
		z.object({
			event: z.literal('pub'),
			pubTitle: z.string(),
			pubId: z.string().uuid(),
			pubSlug: z.string(),
			collectionIds: z
				.string()
				.regex(/^[a-f0-9-]+(,[a-f0-9-]+)*$/)
				.optional(),
			primaryCollectionId: z.string().uuid().optional(),
			release: z.literal('draft').or(z.number().int().transform(String)),
		}),
	)
	.merge(collectionPageViewPayloadSchema.omit({ event: true }).partial());

export const pageViewPayloadSchema = z.discriminatedUnion('event', [
	otherPageViewPayloadSchema,
	pagePageViewPayloadSchema,
	collectionPageViewPayloadSchema,
	pubPageViewPayloadSchema,
]);

export const pageViewSchema = pageViewPayloadSchema.and(basePageViewSchema);

export const baseTrackSchema = baseSchema.merge(
	z.object({
		type: z.literal('track'),
	}),
);

export const sharedTrackPayloadSchema = sharedEventPayloadSchema;

export const pubDownloadTrackPayloadSchema = sharedTrackPayloadSchema.merge(
	z.object({
		format: z.string(),
		pubId: z.string().uuid(),
	}),
);

export const pubDownloadTrackSchema = pubDownloadTrackPayloadSchema.merge(
	z.object({
		event: z.literal('download'),
	}),
);

// this is just here to set up the discriminated union, can't have a union of one
export const stubTrackPayloadSchema = sharedTrackPayloadSchema.merge(z.object({}));

export const stubTrackSchema = stubTrackPayloadSchema.merge(
	z.object({
		event: z.literal('stub'),
	}),
);

export const trackSchemaPayloadSchemaWithEvent = z.discriminatedUnion('event', [
	pubDownloadTrackSchema,
	stubTrackSchema,
]);

export const trackSchema = trackSchemaPayloadSchemaWithEvent.and(baseTrackSchema);

export const analyticsEventSchema = z.union([trackSchema, pageViewSchema]);

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;

export type PageViewPayload = (typeof pageViewPayloadSchema)['_input'];

export type PageView = z.infer<typeof pageViewSchema>;

export type PubDownloadPayload = z.infer<typeof pubDownloadTrackPayloadSchema>;

export type Track = z.infer<typeof trackSchema>;

export type TrackPayloadWithEvent = z.infer<typeof trackSchemaPayloadSchemaWithEvent>;

export type TrackEvent = TrackPayloadWithEvent['event'];

export type TrackPayload<T extends TrackEvent = TrackEvent> = T extends any
	? Prettify<Omit<TrackPayloadWithEvent & { event: T }, 'event'>>
	: never;
