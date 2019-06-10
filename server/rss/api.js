import app from '../server';
import { getCommunityRss } from './queries';

app.get('/rss.xml', (req, res) => {
	return getCommunityRss(req.hostname)
		.then((feedXML) => {
			res.set('Content-Type', 'text/xml');
			return res.send(feedXML);
		})
		.catch((err) => {
			console.error('Error in getCommunityRSS: ', err);
			return res.status(500).json(err.message);
		});
});
