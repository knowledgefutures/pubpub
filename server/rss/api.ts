import app, { wrap } from 'server/server';
import { getInitialData } from 'server/utils/initData';

import { getCommunityRss } from './queries';

app.get(
	'/rss.xml',
	wrap(async (req, res) => {
		const initialData = await getInitialData(req);
		const feedXml = await getCommunityRss(initialData.communityData, req.query);
		res.header('Content-Type', 'text/xml');
		return res.status(200).send(feedXml);
	}),
);
