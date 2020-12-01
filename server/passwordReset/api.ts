import app from 'server/server';

import { createPasswordReset, updatePasswordReset } from './queries';

app.post('/api/password-reset', (req, res) => {
	const user = req.user || {};
	return createPasswordReset(req.body, user, req.hostname)
		.then(() => {
			return res.status(200).json('success');
		})
		.catch((err) => {
			console.error('Error in postPasswordReset: ', err);
			return res.status(500).json(err.message);
		});
});

app.put('/api/password-reset', (req, res) => {
	const user = req.user || {};
	return updatePasswordReset(req.body, user)
		.then(() => {
			return res.status(200).json('success');
		})
		.catch((err) => {
			console.error('Error in putPasswordReset: ', err);
			return res.status(500).json(err.message);
		});
});
