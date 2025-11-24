import { Router } from 'express';
import passport from 'passport';

import { User } from 'server/models';
import { wrap } from 'server/wrap';
import { isDevelopment } from 'utils/environment';

export const router = Router();

router.get(
	'/auth/zotero',
	wrap(async (req, res, next) => {
		if (req.user) {
			const authRedirectHost = req.get('host');
			await User.update({ authRedirectHost }, { where: { id: req.user.id } });
		} else {
			res.redirect('/');
		}
		next();
	}),
	passport.authenticate('zotero', { state: 'test' }),
);

// callback route for zotero to redirect to
// hand control to passport to use code to grab profile info
router.get('/auth/zotero/redirect', (req, res, next) => {
	const host = req.user?.authRedirectHost;
	const urlBase = isDevelopment() ? 'http://lvh.me:9876' : `https://${host}`;

	passport.authenticate('zotero', {
		failureRedirect: `${urlBase}/legal/settings?integration=fail`,
		successRedirect: `${urlBase}/legal/settings?integration=success`,
	})(req, res, next);
});
