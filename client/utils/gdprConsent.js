import Cookies from 'js-cookie';

import { apiFetch } from './apiFetch';

const cookieKey = 'gdpr-consent';
const persistSignupCookieKey = 'gdpr-consent-survives-login';

const odiousCookies = ['keen'];
const deleteOdiousCookies = () => odiousCookies.map((key) => Cookies.remove(key, { path: '' }));

const getCookieOptions = () => ({
	expires: 365 * 1000,
	// If we're on pubpub.org or x.pubpub.org, make the cookie valid for [y.]pubpub.org
	...(window.location.host.includes('pubpub.org') && { domain: '.pubpub.org' }),
});

export const gdprCookiePersistsSignup = () => Cookies.get(persistSignupCookieKey) === 'yes';

export const getGdprConsentElection = (loginData = null) => {
	const cookieValue = Cookies.get(cookieKey);
	if (loginData && loginData.id && loginData.gdprConsent !== null) {
		return loginData.gdprConsent === true;
	}
	if (cookieValue) {
		return cookieValue === 'accept';
	}
	return null;
};

export const shouldShowGdprBanner = (loginData) => {
	if (loginData.id && loginData.gdprConsent === null) {
		return true;
	}
	return getGdprConsentElection(loginData) === null;
};

export const updateGdprConsent = (loginData, doesUserConsent) => {
	const loggedIn = !!loginData.id;
	const cookieOptions = getCookieOptions();
	Cookies.set(cookieKey, doesUserConsent ? 'accept' : 'decline', cookieOptions);
	Cookies.set(persistSignupCookieKey, 'yes', cookieOptions);
	if (!doesUserConsent) {
		deleteOdiousCookies();
	}
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
