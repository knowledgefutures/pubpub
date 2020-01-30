import Cookie from 'js-cookie';
import { getCookieOptions } from './cookieOptions';

const cookieKey = 'tos-update';
const tosLastUpdated = Date.parse('2020-01-01');

export const shouldShowTosUpdate = () => {
	const cookieValue = Cookie.get(cookieKey);
	if (cookieValue && parseInt(cookieValue, 10) > tosLastUpdated) {
		return false;
	}
	return true;
};

export const markTosUpdateSeen = () => {
	const seenAt = Date.now();
	Cookie.set(cookieKey, seenAt, getCookieOptions());
};
