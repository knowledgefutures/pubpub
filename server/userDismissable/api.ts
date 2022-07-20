import app, { wrap } from 'server/server';

import { dismissUserDismissable } from './queries';

app.post(
	'/api/userDismissable',
	wrap(async (req, res) => {
		const { user, body } = req;
		if (req.user && body.key) {
			await dismissUserDismissable(user.id, body.key);
			return res.status(200).json({});
		}
		return res.status(401).json({});
	}),
);
