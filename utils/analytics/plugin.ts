/* eslint-disable no-undef, import/no-unresolved */
import { AnalyticsInstance, type AnalyticsPlugin } from 'analytics';

const ANALYTICS_ENDPOINT = '/api/analytics/track' as const;

/**
 * Retrieves the referrer URL and determines if the visit is from a unique visitor If there is no
 * referrer, returns null for the referrer and false for unique.
 *
 * Inspired by {@link https://docs.simpleanalytics.com/explained/unique-visits | Simple Analytics}
 *
 * @returns An object containing the referrer URL and a boolean indicating if it is unique.
 */
const getReferrerAndUnique = () => {
	if (!document.referrer) {
		return { referrer: null, unique: true };
	}

	const referrerUrl = new URL(document.referrer);
	const currentUrl = new URL(window.location.href);

	return { referrer: document.referrer, unique: referrerUrl.origin !== currentUrl.origin };
};

const sendData = (data: { payload: any; instance: AnalyticsInstance }) => {
	const { payload, instance } = data;

	// we don't want to track page renders on the server, as we cache most pages
	if (!globalThis.navigator || typeof globalThis?.navigator?.sendBeacon !== 'function') {
		return;
	}

	const { context } = instance.getState();

	const {
		timezone,
		os: { name: os },
		locale,
		campaign,
		userAgent,
	} = context;

	const {
		event,
		type,
		meta: { ts },
		properties,
	} = payload;

	const utmCampaign = campaign
		? Object.fromEntries(
				Object.entries(campaign).map(([key, value]) => [
					`utm${
						key === 'name' ? 'Campaign' : key.charAt(0).toUpperCase() + key.slice(1)
					}`,
					value,
				]),
		  )
		: {};

	// we use navigator.sendBeacon to make sure the request is sent even if the user navigates away from the page
	// and doesn't block the rest of the page
	navigator.sendBeacon(
		ANALYTICS_ENDPOINT,
		JSON.stringify({
			event,
			type,
			timestamp: ts,
			timezone,
			locale,
			userAgent,
			os,
			...properties,
			...getReferrerAndUnique(),
			...utmCampaign,
		}),
	);
};

export const analyticsPlugin = () => {
	return {
		name: 'analytics-plugin',
		page: sendData,
		track: sendData,
		loaded: () => true,
		ready: () => true,
	} satisfies AnalyticsPlugin;
};

export const stubPlugin = () => {
	return {
		name: 'stub-plugin',
		page: () => {},
		track: () => {},
		loaded: () => true,
		ready: () => true,
	} satisfies AnalyticsPlugin;
};
