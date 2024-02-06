import { useCallback, useEffect, useState } from 'react';
import type { PageViewPayload } from 'utils/api/schemas/analytics';
import { useAnalytics } from './useAnalytics';
import { getThirdPartyPluginsObjectWithGdprConsent } from './thirdPartyPlugins';

/**
 * Custom hook that sends a page view event to the analytics services only once.
 *
 * Also handles rerender logic for GDPR consent when using Google Analytics.
 *
 * # Base Flow f
 *
 * 1. Page loads with our analytics enabled
 * 2. Page view event is sent to only our analytics service
 *
 * This always happens, regardless of consent.
 *
 * ## Flow for privacy friendly 3rd party analytics provider, or Google Analytics + consent given
 *
 * 3. Other analytics provider is loaded in dynamically
 * 4. Page view event is sent to other analytics provider
 *
 * ## Flow for Google Analytics + consent not yet given
 *
 * 3. User gives consent by e.g. clicking "Accept" on the cookie banner
 * 4. Google Analytics is loaded in dynamically
 * 5. Page view event is sent to Google Analytics
 *
 * ## Flow for Google Analytics + consent refused
 *
 * Nothing happens on top of the base flow, Google Analytics is never loaded.
 *
 * @param payload - The payload containing the page view data or a function that returns the
 *   payload.
 * @param gdprConsent - Optional boolean indicating whether GDPR consent has been given.
 */
export const usePageOnce = (
	payload: PageViewPayload | (() => PageViewPayload | null),
	gdprConsent?: boolean | null,
) => {
	const { page, getState } = useAnalytics();
	const [hasFiredInitialEvent, setHasFiredInitialEvent] = useState(false);
	const [hasFiredLazyPlugin, setHasFiredLazyPlugin] = useState(false);

	// Function to get the payload
	const getPayload = useCallback(
		() => (typeof payload === 'function' ? payload() : payload),
		[payload],
	);

	const { plugins } = getState();

	const pluginLength = Object.keys(plugins).length;

	useEffect(() => {
		const allEventsHaveFired = hasFiredInitialEvent && hasFiredLazyPlugin;
		if (allEventsHaveFired) {
			return;
		}

		const toBeSentPayload = getPayload();
		if (!toBeSentPayload) {
			return;
		}

		// Initial event firing with our custom plugin (only once), before other plugins are loaded
		if (!hasFiredInitialEvent) {
			page(toBeSentPayload, {
				plugins: {
					all: false,
					'analytics-plugin': true,
				},
			});
			setHasFiredInitialEvent(true);
			return;
		}

		const enabledGdprPlugins = getThirdPartyPluginsObjectWithGdprConsent(
			Boolean(gdprConsent),
			plugins,
		);
		page(toBeSentPayload, {
			plugins: {
				all: false,
				...enabledGdprPlugins,
			},
		});
		setHasFiredLazyPlugin(true);
		/**
		 * The only change we need to track is whether the custom analytics get loaded afterwards or
		 * not
		 */
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pluginLength]);
};
