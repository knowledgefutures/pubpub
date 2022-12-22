import app from 'server/server';
import { getInitialData } from 'server/utils/initData';
import { handleErrors, NotFoundError } from 'server/utils/errors';
import { getCommunityRss } from './queries';

app.get('/rss.xml', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.communityData?.id) {
			throw new NotFoundError();
		}
		const feedXml = await getCommunityRss(initialData.communityData, req.query);
		res.header('Content-Type', 'text/xml');
		return res.status(200).send(feedXml);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
