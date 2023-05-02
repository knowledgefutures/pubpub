import app from 'server/server';

app.get('/api/logout', (req, res) => {
	res.cookie('gdpr-consent-survives-login', 'no');
	res.cookie('pp-cache', 'pp-cache', {
		...(req.get('hostname')?.includes('pubpub.org') && { domain: '.pubpub.org' }),
		...(req.get('hostname')?.includes('duqduq.org') && { domain: '.duqduq.org' }),
	});
	// @ts-expect-error
	req.logout();
	return res.status(200).json('success');
});
