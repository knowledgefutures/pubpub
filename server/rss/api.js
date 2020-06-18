import app from 'server/server';
import { handleErrors } from 'server/utils/errors';

import { getCommunityRss } from './queries';

app.get('/rss.xml', (req, res, next) => {
	return getCommunityRss(req.hostname)
		.then((feedXML) => {
			res.set('Content-Type', 'text/xml');
			return res.send(feedXML);
		})
		.catch(handleErrors(req, res, next));
});
