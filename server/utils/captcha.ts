import { verifySolution } from 'altcha-lib';

import { isProd } from 'utils/environment';

/**
 * captcha + honeypot system
 *
 * captcha (altcha):
 *   proof-of-work challenge verified server-side via HMAC. in prod, ALTCHA_HMAC_KEY
 *   must be set. in dev/test the fallback key is used automatically.
 *   set BYPASS_CAPTCHA=true to skip verification entirely (useful in tests).
 *   to test captcha behavior specifically, unset BYPASS_CAPTCHA and use altcha-lib
 *   to generate a valid payload with getAltchaHmacKey().
 *
 * honeypot:
 *   hidden form fields with natural-looking names (e.g. "title", "description").
 *   the client maps the value to `_honeypot` in the request body.
 *   if filled, the user is tagged as confirmed-spam via handleHoneypotTriggered.
 *   see server/utils/honeypot.ts.
 */

const DEV_HMAC_KEY = 'dev-altcha-hmac-key-do-not-use-in-production';

export const getAltchaHmacKey = (): string => {
	const key = process.env.ALTCHA_HMAC_KEY;
	if (isProd() && !key) {
		throw new Error('ALTCHA_HMAC_KEY must be set in production');
	}
	return key ?? DEV_HMAC_KEY;
};

export const isCaptchaBypassed = (): boolean => process.env.BYPASS_CAPTCHA === 'true';

export const verifyCaptchaPayload = async (payload: unknown): Promise<boolean> => {
	if (isCaptchaBypassed()) return true;
	if (!payload || typeof payload !== 'string') return false;
	const hmacKey = getAltchaHmacKey();
	return verifySolution(payload, hmacKey);
};
