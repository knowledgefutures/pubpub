import app, { wrap } from 'server/server';
import { getInitialData } from 'server/utils/initData';

import { getCommunityRss } from './queries';

const cannotLoadCommunities = ['3e88f64f-b43b-45c3-8067-e64eb9c5a7c7'];

app.get(
	'/rss.xml',
	wrap(async (req, res) => {
		const initialData = await getInitialData(req);
		if (cannotLoadCommunities.includes(initialData.communityData.id)) {
			return res.status(401).send();
		}
		const feedXml = await getCommunityRss(initialData.communityData, req.query);
		res.header('Content-Type', 'text/xml');
		return res.status(200).send(feedXml);
	}),
);
