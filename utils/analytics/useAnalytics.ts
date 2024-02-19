import type { AnalyticsType } from 'types';
import type { PageViewPayload, TrackPayload, TrackEvent } from 'utils/api/schemas/analytics';
import { useAnalytics as useOldAnalytics } from 'use-analytics';
import type { AnalyticsInstance } from 'analytics';
import { stubPlugin } from './plugin';

type Analytics = {
	track: <T extends TrackEvent>(event: T, data: TrackPayload<T>) => void;
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
