import app from '../server';

app.get('/api/logout', (req, res) => {
	req.logout();
	return res.status(200).json('success');
});
