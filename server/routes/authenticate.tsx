import passport from 'passport';
import app from 'server/server';

app.get('/auth/zotero', passport.authenticate('zotero'));

// callback route for zotero to redirect to
// hand control to passport to use code to grab profile info
app.get(
	'/auth/zotero/redirect',
	passport.authenticate('zotero', {
		failureRedirect: '/legal/settings?integration=fail',
		successRedirect: '/legal/settings?integration=success',
	}),
);
