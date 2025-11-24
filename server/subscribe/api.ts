import { Router } from 'express';

import { subscribeToMailchimp } from './queries';

export const router = Router();

router.post('/api/subscribe', (req, res) => {
	return subscribeToMailchimp(req.body)
		.then(() => {
			return res.status(200).json(true);
		})
		.catch((err) => {
			console.error('Error in postSubscribe: ', err);
			return res.status(500).json(err.message);
		});
});
