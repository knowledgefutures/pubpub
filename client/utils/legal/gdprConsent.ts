import Cookies from 'js-cookie';
import type { InitialCommunityData, InitialData, LoginData } from 'types';

import { canUseCustomAnalyticsProvider, noCookieBanner } from 'utils/analytics/featureFlags';
import { apiFetch } from '../apiFetch';

import { getCookieOptions } from './cookieOptions';

const cookieKey = 'gdpr-consent';
const persistSignupCookieKey = 'gdpr-consent-survives-login';

const deleteGoogleCookies = () => {
	Object.keys(Cookies.get()).forEach((key) => {
		if (key.startsWith('_ga')) {
			Cookies.remove(key);
		}
	});
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
	loginData,
	featureFlags,
	communityData: { analyticsSettings },
}: {
	loginData: LoginData;
	featureFlags: InitialData['featureFlags'];
	communityData: InitialCommunityData;
}) => {
	const doesNotNeedCookieBanner =
		analyticsSettings?.type !== 'google-analytics' ||
		!canUseCustomAnalyticsProvider(featureFlags) ||
		noCookieBanner(featureFlags);

	if (doesNotNeedCookieBanner) {
		return false;
	}

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
		deleteGoogleCookies();
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
