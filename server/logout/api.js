import app from '../server';

app.get('/api/logout', (req, res) => {
	res.cookie('gdpr-consent-survives-login', 'no');
	req.logout();
	return res.status(200).json('success');
});
