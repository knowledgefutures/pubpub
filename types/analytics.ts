import type { z } from 'zod';
import type {
	analyticsEventSchema,
	pageViewPayloadSchema,
	pageViewSchema,
	pubDownloadTrackPayloadSchema,
	trackSchema,
} from 'utils/api/schemas/analytics';
import { Prettify } from './util';

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;

export type PageViewPayload = z.infer<typeof pageViewPayloadSchema>;

export type PageView = z.infer<typeof pageViewSchema>;

export type PubDownloadPayload = z.infer<typeof pubDownloadTrackPayloadSchema>;

export type Track = z.infer<typeof trackSchema>;

export type TrackPayload<T extends Track = Track> = T extends any
	? Prettify<Omit<T, 'event' | 'type'>>
	: never;
