import app from '../server';
import { subscribeUser } from '../mailchimpHelpers';

app.post('/api/subscribe', (req, res)=> {
	const email = req.body.email;
	const list = req.body.list || '2847d5271c';
	const tags = req.body.tags || [];
	subscribeUser(email, list, tags)
	.then((result) => {
		return res.status(200).json(true);
	})
	.catch((err) => {
		return res.status(500).json(err.message);
	});
});
