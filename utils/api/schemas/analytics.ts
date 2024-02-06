import { z } from 'zod';

import type { Prettify } from 'types/util';

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

export const sharedPageViewPayloadSchema = z.object({
	communityId: z.string().uuid(),
	communityName: z.string(),
	event: z.enum(['page', 'collection', 'pub']),
});

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
			collectionIds: z.array(z.string().uuid()),
			primaryCollectionId: z.string().uuid().optional(),
		}),
	)
	.merge(collectionPageViewPayloadSchema.omit({ event: true }).partial());

export const pageViewPayloadSchema = z.discriminatedUnion('event', [
	pagePageViewPayloadSchema,
	collectionPageViewPayloadSchema,
	pubPageViewPayloadSchema,
]);

export const pageViewSchema = pageViewPayloadSchema.and(basePageViewSchema);

export const pubDownloadTrackPayloadSchema = z.object({
	format: z.string(),
	pubId: z.string().uuid(),
});

export const pubDownloadTrackSchema = pubDownloadTrackPayloadSchema.extend({
	type: z.literal('track'),
	event: z.literal('download'),
});

// this is just here to set up the discriminated union, can't have a union of one
export const stubTrackPayloadSchema = z.object({});

export const stubTrackSchema = z.object({
	type: z.literal('track'),
	event: z.literal('stub'),
});

export const trackSchema = z.discriminatedUnion('event', [pubDownloadTrackSchema, stubTrackSchema]);

export const trackSchemaFull = baseSchema.and(trackSchema);

export const analyticsEventSchema = z.union([trackSchemaFull, pageViewSchema]);

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;

export type PageViewPayload = z.infer<typeof pageViewPayloadSchema>;

export type PageView = z.infer<typeof pageViewSchema>;

export type PubDownloadPayload = z.infer<typeof pubDownloadTrackPayloadSchema>;

export type Track = z.infer<typeof trackSchema>;

export type TrackPayload<T extends Track = Track> = T extends any
	? Prettify<Omit<T, 'event' | 'type'>>
	: never;
