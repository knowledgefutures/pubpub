import type { AnalyticsInstance } from 'analytics';

import type { InitialData, Page, PubPageData } from 'types';
import type { PageViewPayload } from 'utils/api/schemas/analytics';

import { useEffect, useState } from 'react';

import { chooseCollectionForPub } from 'client/utils/collections';
import { expect } from 'utils/assert';
import { getPrimaryCollection } from 'utils/collections/primary';

import { shouldPathBeIgnored } from './ignoredPaths';
import { getThirdPartyPluginsObjectWithGdprConsent } from './thirdPartyPlugins';

const determinePayload = (
	props:
		| {
				initialData: InitialData;
				viewData: any;
		  }
		| {
				payload: PageViewPayload | (() => PageViewPayload | null);
		  },
): PageViewPayload | null => {
	if ('payload' in props) {
		const { payload } = props;
		return typeof payload === 'function' ? payload() : payload;
	}

	const { initialData, viewData } = props;
	const { scopeData, communityData, locationData } = initialData;

	// pub pageview
	if (scopeData.scope && 'pubId' in scopeData.scope && scopeData.scope.pubId) {
		const pubData = viewData.pubData as PubPageData | null; // null if 404;

		if (!pubData) {
			return null;
		}

		const uniqueCollectionIds = Array.from(
			new Set((pubData.collectionPubs ?? []).map((cp) => cp.collectionId)),
		);
		// we want to make this a string of comma separated UUIDs instead of an array
		// because Stitch will turn an array into a separate table with an event for each
		// UUID in the array, which creates a ton of events for a single page view if the pub
		// is in a lot of collections
		// much easier to just have a single event with a string of UUIDs and then do some
		// processing in Metabase
		const collectionIds = uniqueCollectionIds.join(',') || undefined;
		const collection = chooseCollectionForPub(pubData, locationData);

		return {
			event: 'pub',
			pubSlug: pubData.slug,
			pubId: pubData.id,
			pubTitle: pubData.title,
			collectionIds,
			collectionId: collection?.id,
			collectionTitle: collection?.title,
			collectionSlug: collection?.slug,
			primaryCollectionId: getPrimaryCollection(pubData?.collectionPubs)?.id,
			collectionKind: collection?.kind,
			communityId: pubData.communityId,
			communityName: communityData.title,
			communitySubdomain: communityData.subdomain,
			isProd: locationData.isProd,
			release:
				pubData.isRelease && pubData.releaseNumber
					? pubData.releaseNumber
					: ('draft' as const),
		};
	}

	const base = {
		communityId: communityData.id,
		communityName: communityData.title,
		communitySubdomain: communityData.subdomain,
		isProd: locationData.isProd,
	};

	const collection = scopeData?.elements?.activeCollection;

	// collection pageview
	if (collection) {
		return {
			event: 'collection' as const,
			collectionId: collection.id,
			collectionTitle: collection.title,
			collectionSlug: collection.slug,
			collectionKind: expect(collection.kind),
			...base,
		};
	}

	const pageData = viewData?.pageData as Page;

	// it's not a pub, page, or collection, so it's something else,
	// like the explore page or a user page
	if (!pageData) {
		return {
			event: 'other' as const,
			...base,
			communityId: communityData.id ?? null,
			communityName: communityData.title ?? 'pubpub',
			communitySubdomain: communityData.subdomain ?? 'www',
		};
	}

	// normal pageview
	return {
		event: 'page' as const,
		pageSlug: pageData.slug,
		pageTitle: pageData.title,
		pageId: pageData.id,
		...base,
	};
};

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
	props: { analyticsInstance: AnalyticsInstance; gdprConsent?: boolean | null } & (
		| {
				payload: PageViewPayload | (() => PageViewPayload | null);
		  }
		| {
				initialData: InitialData;
				viewData: any;
		  }
	),
) => {
	const { analyticsInstance, gdprConsent, ...rest } = props;

	const { page, getState } = analyticsInstance;

	const [hasFiredInitialEvent, setHasFiredInitialEvent] = useState(false);
	const [hasFiredLazyPlugin, setHasFiredLazyPlugin] = useState(false);

	const { plugins } = getState();

	const pluginLength = Object.keys(plugins).length;

	useEffect(() => {
		const allEventsHaveFired = hasFiredInitialEvent && hasFiredLazyPlugin;
		if (allEventsHaveFired) {
			return;
		}

		const { path } =
			rest && 'initialData' in rest ? rest.initialData.locationData : { path: '' };
		const shouldIgnorePath = shouldPathBeIgnored(path);

		// we do not track analytics for such paths
		if (shouldIgnorePath) {
			return;
		}

		// we don't want to track 404 pages. not really a path per se
		// hence we don't include it in the above
		if (/^Not Found ·/.test(window.document?.title)) {
			return;
		}

		const toBeSentPayload = determinePayload(rest);
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
	}, [pluginLength]);
};
