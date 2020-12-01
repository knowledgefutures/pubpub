import app from 'server/server';

import { subscribeToMailchimp } from './queries';

app.post('/api/subscribe', (req, res) => {
	return subscribeToMailchimp(req.body)
		.then(() => {
			return res.status(200).json(true);
		})
		.catch((err) => {
			console.error('Error in postSubscribe: ', err);
			return res.status(500).json(err.message);
		});
});
