/**
 * Phase C: Login page redirect.
 *
 * Instead of SSR-rendering the PubPub login page, redirect to KF Auth's
 * OIDC login flow. The /auth/login route in server/kf/api.ts handles
 * building the OIDC authorize URL with PKCE and state.
 */

import { Router } from 'express';

export const router = Router();

router.get('/login', (req, res) => {
	const returnTo = req.query.redirect || req.query.return_to || '/';
	return res.redirect(`/auth/login?return_to=${encodeURIComponent(String(returnTo))}`);
});
