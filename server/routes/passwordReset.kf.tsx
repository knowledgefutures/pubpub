/**
 * Phase C: Password reset redirect.
 *
 * Password management now happens through KF Auth.
 * Redirect both the request-reset page and the reset-with-hash page.
 */

import { Router } from 'express';

import { OIDC_ISSUER_URL } from 'server/kf/auth';

export const router = Router();

router.get(['/password-reset', '/password-reset/:resetHash/:slug'], (req, res) => {
	// Old reset links won't work; redirect to KF Auth's password reset flow
	return res.redirect(`${OIDC_ISSUER_URL}/forgot-password`);
});
