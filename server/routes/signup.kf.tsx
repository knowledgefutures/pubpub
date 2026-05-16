/**
 * Phase C: Signup page redirect.
 *
 * Instead of rendering the PubPub signup page, redirect to KF Auth's
 * sign-up flow. KF Auth handles account creation now.
 */

import { Router } from 'express';

import { KF_AUTH_URL, KF_AUTH_CLIENT_ID, APP_URL } from 'server/kf/auth';

export const router = Router();

router.get('/signup', (req, res) => {
	// Redirect to KF Auth's sign-up page, passing the PubPub client_id
	// so KF Auth shows PubPub-branded signup and redirects back after.
	const params = new URLSearchParams({
		client_id: KF_AUTH_CLIENT_ID,
		redirect_uri: `${APP_URL}/auth/callback`,
	});
	return res.redirect(`${KF_AUTH_URL}/sign-up?${params}`);
});

// Also redirect the /user/create/:hash route (email verification step)
// These links in old verification emails won't work after migration;
// users who click them should be directed to sign up fresh via KF Auth.
router.get('/user/create/:hash', (req, res) => {
	return res.redirect(`${KF_AUTH_URL}/sign-up`);
});
