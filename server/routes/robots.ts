import app, { wrap } from 'server/server';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { communityUrl } from 'utils/canonicalUrls';

const BASE_ROBOTS = `User-agent: *
Disallow:`;

const buildRobotsFile = (community) => {
	if (community) {
		return `${BASE_ROBOTS}
Sitemap: ${communityUrl(community)}/sitemap-index.xml`;
	}
	return BASE_ROBOTS;
};

app.get(
	'/robots.txt',
	wrap(async (req, res) => {
		if (!hostIsValid(req, 'community')) {
			// @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 0.
			return buildRobotsFile();
		}

		const { communityData } = await getInitialData(req, true);

		res.header('Content-Type', 'text/plain');

		return res.send(buildRobotsFile(communityData));
	}),
);
