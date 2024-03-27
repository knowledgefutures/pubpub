import fetch from 'node-fetch';
import { pipeline } from 'stream';
import { promisify } from 'util';

import app, { wrap } from 'server/server';
import { ForbiddenError, NotFoundError, handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { getPubForRequest } from 'server/utils/queryHelpers';
import { getBestDownloadUrl } from 'utils/pub/downloads';
import { defer } from 'server/utils/deferred';
import { createPubExportsForLatestRelease } from 'server/export/queries';
import { hostIsValid } from 'server/utils/routes';

app.get(
	['/pub/:pubSlug/download', '/pub/:pubSlug/download/:format'],
	wrap(async (req, res, next) => {
		if (!hostIsValid(req, 'community')) {
			return next();
		}
		try {
			const initialData = await getInitialData(req);
			const { pubSlug, format = null } = req.params;

			const pubData = await getPubForRequest({ slug: pubSlug, initialData });
			const bestPubDownloadUrl = getBestDownloadUrl(pubData, format);

			if (!pubData || pubData.releases.length === 0) {
				throw new ForbiddenError();
			}

			if (bestPubDownloadUrl) {
				res.attachment(bestPubDownloadUrl);
				const downloadResponse = await fetch(bestPubDownloadUrl);
				if (downloadResponse.ok) {
					return promisify(pipeline)(downloadResponse.body, res);
				}
			}

			// If there's no download URL then we'll want to regenerate the Pub's exports to produce
			// an auto-generated PDF. We generally shouldn't get into this state, since those are
			// generated when a Pub is released -- and this route only works for released Pubs.
			defer(async () => {
				await createPubExportsForLatestRelease(pubData.id);
			});

			throw new NotFoundError();
		} catch (err) {
			return handleErrors(req, res, next)(err);
		}
	}),
);
