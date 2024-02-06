import { useAnalytics as useOldAnalytics } from 'use-analytics';
import type { AnalyticsInstance } from 'analytics';
import type { AnalyticsType } from 'types';
import { stubPlugin } from './plugin';

type Tracks = {
	type: 'download';
	payload: {
		format: string;
		pubId: string;
	};
};

type PageViewPayloadBase = {
	communityId: string;
	communityName?: string;
	title: string;
};

type CollectionPayloadPart = {
	collectionId: string;
	collectionSlug: string;
	collectionTitle: string;
};

type PageViewPub = PageViewPayloadBase & {
	type: 'pub';
	pubId: string;
	pubSlug: string;
	pubTitle: string;
	collectionIds?: string[];
	primaryCollectionId?: string;
} & Partial<CollectionPayloadPart>;

type PageViewCollection = PageViewPayloadBase & {
	type: 'collection';
} & CollectionPayloadPart;

type PageViewPage = PageViewPayloadBase & {
	type: 'page';
	pageSlug: string;
};

export type PageViewPayload = PageViewPub | PageViewCollection | PageViewPage;

type Analytics = {
	track: <T extends Tracks>(event: T['type'], data: T['payload']) => void;
	page: <Payload extends PageViewPayload>(
		payload?: Payload,
		options?: {
			plugins: {
				all?: boolean;
				'analytics-plugin'?: boolean;
			} & { [K in AnalyticsType]?: boolean };
		},
	) => void;
} & Omit<AnalyticsInstance, 'page' | 'track'>;

/**
 * A custom hook that wraps the use-analytics hook.
 *
 * Used in order to get proper types for the analytics instance, to stub the analytics instance when
 * SSRing, and provide easy to aceses information about whether the analytics instance is stubbed or
 * not.
 */
export const useAnalytics = () => {
	const { getState, ...analytics } = useOldAnalytics();

	const { track: stubTrack, page: stubPage } = stubPlugin();

	/** We do not want to send any events when SSRing */
	if (typeof window === 'undefined') {
		return {
			...analytics,
			track: stubTrack,
			page: stubPage,
			getState,
		} as Analytics;
	}

	return {
		...analytics,
		getState,
	} as Analytics;
};
