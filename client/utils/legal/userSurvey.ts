import Cookie from 'js-cookie';

import { getCookieOptions } from './cookieOptions';

const cookieKey = 'user-survey-summer-22';

export const sw = () => {
	return !!Cookie.get(cookieKey);
};

export const markUserSurveySeen = () => {
	const seenAt = Date.now().toString();
	Cookie.set(cookieKey, seenAt, getCookieOptions());
};
