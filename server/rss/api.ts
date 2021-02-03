import app from 'server/server';
import { getInitialData } from 'server/utils/initData';
import { handleErrors } from 'server/utils/errors';

import { getCommunityRss } from './queries';

app.get('/rss.xml', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		const feedXml = await getCommunityRss(initialData.communityData, req.query);
		res.header('Content-Type', 'text/xml');
		return res.status(200).send(feedXml);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
