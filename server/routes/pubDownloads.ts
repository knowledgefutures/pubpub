import fetch from 'node-fetch';
import { pipeline } from 'stream';
import { promisify } from 'util';

import app, { wrap } from 'server/server';
import { ForbiddenError, NotFoundError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { getPub } from 'server/utils/queryHelpers';

import { getBestDownloadUrl } from 'utils/pub/downloads';

app.get(
	['/pub/:pubSlug/download', '/pub/:pubSlug/download/:format'],
	wrap(async (req, res) => {
		const { communityData } = await getInitialData(req);
		const { pubSlug, format = null } = req.params;

		const pubData = await getPub(pubSlug, communityData.id);
		const bestPubDownloadUrl = getBestDownloadUrl(pubData, format);

		if (pubData.releases.length === 0) {
			throw new ForbiddenError();
		}

		if (bestPubDownloadUrl) {
			res.attachment(bestPubDownloadUrl);
			const downloadResponse = await fetch(bestPubDownloadUrl);
			if (downloadResponse.ok) {
				return promisify(pipeline)(downloadResponse.body, res);
			}
		}

		throw new NotFoundError();
	}),
);
