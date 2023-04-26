import app from 'server/server';

app.get('/api/logout', (req, res) => {
	res.cookie('gdpr-consent-survives-login', 'no');
	res.cookie('pp-cache', 'pp-cache');
	// @ts-expect-error
	req.logout();
	return res.status(200).json('success');
});
