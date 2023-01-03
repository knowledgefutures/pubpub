import app from 'server/server';

import { getSearchUsers } from './queries';

app.get('/api/search/users', (req, res) => {
	return getSearchUsers(req.query.q as string)
		.then((searchResults) => {
			return res.status(200).json(searchResults);
		})
		.catch((err) => {
			console.error('Error in getSearchUsers: ', err);
			return res.status(500).json(err.message);
		});
});
