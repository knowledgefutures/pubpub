import app from '../server';
import { handleErrors } from '../utils';
import { getCommunityRss } from './queries';

app.get('/rss.xml', (req, res, next) => {
	return getCommunityRss('fishes')
		.then((feedXML) => {
			res.set('Content-Type', 'text/xml');
			return res.send(feedXML);
		})
		.catch(handleErrors(req, res, next));
});
