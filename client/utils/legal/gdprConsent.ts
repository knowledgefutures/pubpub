import Cookies from 'js-cookie';
import type { InitialCommunityData, InitialData, LoginData } from 'types';
// import { canUseCustomAnalyticsProvider, shouldUseNewAnalytics } from 'utils/analytics/featureFlags';

import { apiFetch } from '../apiFetch';

import { getCookieOptions } from './cookieOptions';

const cookieKey = 'gdpr-consent';
const persistSignupCookieKey = 'gdpr-consent-survives-login';

// TODO: replace with Google/Fathom/Simple cookies
const odiousCookies = ['heap'];
const deleteOdiousCookies = () => {
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'heap' does not exist on type 'Window & t... Remove this comment to see the full error message
	window.heap?.resetIdentity();
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'heap' does not exist on type 'Window & t... Remove this comment to see the full error message
	window.heap?.clearEventProperties();
	odiousCookies.map((key) => Cookies.remove(key, { path: '' }));
};

export const gdprCookiePersistsSignup = () => Cookies.get(persistSignupCookieKey) === 'yes';

export const getGdprConsentElection = (loginData: LoginData | null = null) => {
	const cookieValue = Cookies.get(cookieKey);
	if (loginData && loginData.id && loginData.gdprConsent !== null) {
		return loginData.gdprConsent === true;
	}
	if (cookieValue) {
		return cookieValue === 'accept';
	}
	return null;
};

export const shouldShowGdprBanner = ({
	loginData /*
 featureFlags,
 communityData: { analyticsSettings },
*/,
}: {
	loginData: LoginData;
	featureFlags: InitialData['featureFlags'];
	communityData: InitialCommunityData;
}) => {
	// TODO: reinstate this behavior when heap is removed
	// const doesNotNeedCookieBanner =
	// 	analyticsSettings?.type !== 'google-analytics' ||
	// 	!canUseCustomAnalyticsProvider(featureFlags);

	// if (doesNotNeedCookieBanner) {
	// 	return false;
	// }

	if (loginData.id && loginData.gdprConsent === null) {
		return true;
	}
	return getGdprConsentElection(loginData) === null;
};

export const updateGdprConsent = (
	loginData: LoginData,
	doesUserConsent: boolean | null,
	setGDPRConsent: (consent: boolean | null) => void,
) => {
	const loggedIn = !!loginData.id;
	const cookieOptions = getCookieOptions();
	Cookies.set(cookieKey, doesUserConsent ? 'accept' : 'decline', cookieOptions);
	Cookies.set(persistSignupCookieKey, 'yes', cookieOptions);
	if (!doesUserConsent) {
		if (!loggedIn) {
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'heap' does not exist on type 'Window & t... Remove this comment to see the full error message
			window.heap?.identify(Math.random());
		}
		deleteOdiousCookies();
	}

	setGDPRConsent(doesUserConsent);

	if (loggedIn) {
		return apiFetch('/api/users', {
			method: 'PUT',
			body: JSON.stringify({
				userId: loginData.id,
				gdprConsent: doesUserConsent,
			}),
		});
	}
	return Promise.resolve();
};
