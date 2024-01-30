/* eslint-disable no-undef, import/no-unresolved */
import { type AnalyticsPlugin } from 'analytics';

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
		return { referrer: null, unique: false };
	}

	const referrerUrl = new URL(document.referrer);
	const currentUrl = new URL(window.location.href);

	return { referrer: document.referrer, unique: referrerUrl.origin === currentUrl.origin };
};

/**
 * Adds referrer information to the payload. If there is no referrer, sets referrer to null and
 * sameReferrer to false.
 *
 * @param payload - The payload object containing properties.
 * @returns The updated payload object with referrer and sameReferrer properties.
 */
const updatePayload = <P extends { properties: Record<string, any> }>(payload: P) => {
	return {
		...payload,
		properties: {
			...payload.properties,
			...getReferrerAndUnique(),
		},
	};
};

const sendData = ({ payload }: { payload: any }) => {
	// we don't want to track page renders on the server, as we cache most pages
	if (!globalThis.navigator || typeof globalThis?.navigator?.sendBeacon !== 'function') {
		return;
	}

	const updatedPayload = updatePayload(payload);

	// we use navigator.sendBeacon to make sure the request is sent even if the user navigates away from the page
	// and doesn't block the rest of the page
	navigator.sendBeacon(ANALYTICS_ENDPOINT, JSON.stringify(updatedPayload));
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
