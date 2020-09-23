import fetch from 'node-fetch';
import { pipeline } from 'stream';
import { promisify } from 'util';

import app, { wrap } from 'server/server';
import { ForbiddenError, NotFoundError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { getPub } from 'server/utils/queryHelpers';

import { getFormattedDownloadUrl, getPublicExportUrl } from 'utils/pub/downloads';

const getBestDownloadUrl = (pubData) => {
	const formattedDownloadUrl = getFormattedDownloadUrl(pubData);
	if (formattedDownloadUrl) {
		return formattedDownloadUrl;
	}
	return getPublicExportUrl(pubData, 'pdf');
};

app.get(
	'/pub/:pubSlug/download',
	wrap(async (req, res) => {
		const { communityData } = await getInitialData(req);
		const { pubSlug } = req.params;

		const pubData = await getPub(pubSlug, communityData.id);
		const bestPubDownloadUrl = getBestDownloadUrl(pubData);

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
