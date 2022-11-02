import AWS from 'aws-sdk';
import { SitemapAndIndexStream, SitemapStream } from 'sitemap';
import * as stream from 'stream';
import { promisify } from 'util';
import { createGzip } from 'zlib';

import { isProd } from 'utils/environment';
import { Page, Pub, Release } from 'server/models';
import app, { wrap } from 'server/server';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { communityUrl, pubUrl, pageUrl } from 'utils/canonicalUrls';

const s3 = new AWS.S3({ params: { Bucket: 'sitemaps.pubpub.org' } });
const pipeline = promisify(stream.pipeline);
const keyPrefix = isProd() ? 'prod' : 'dev';

const uploadFromStream = (key) => {
	const pass = new stream.PassThrough();
	const params = { Key: key, Body: pass, ACL: 'public-read' };

	// @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
	s3.upload(params, (err) => {
		if (err) {
			console.error(err);
		}
		pass.end();
	});

	return pass;
};

// @ts-expect-error ts-migrate(2525) FIXME: Initializer provides no value for this binding ele... Remove this comment to see the full error message
const getSitemapKey = (community, { filename, index = 'index' } = {}) =>
	`${keyPrefix}/${community.id}/${filename || `sitemap-${index}.xml`}.gz`;

const shouldGenerateSitemapIndex = async (community) => {
	try {
		// @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
		const metadata = await s3.headObject({ Key: getSitemapKey(community) }).promise();
		// Re-generate the sitemap index if sitemap has not been updated within
		// the last 24 hours.
		// @ts-expect-error ts-migrate(2363) FIXME: The right-hand side of an arithmetic operation mus... Remove this comment to see the full error message
		return Date.now() - metadata.LastModified >= 8.64e7;
	} catch (err) {
		return true;
	}
};

const maybeGenerateSitemapIndex = async (community) => {
	if (!(await shouldGenerateSitemapIndex(community))) {
		return false;
	}

	const hostname = communityUrl(community);
	const pubs = await Pub.findAll({
		where: {
			communityId: community.id,
		},
		include: [
			{
				model: Release,
				as: 'releases',
				required: true,
				attributes: [],
			},
		],
		attributes: ['slug'],
	});
	const pages = await Page.findAll({
		where: {
			communityId: community.id,
			isPublic: true,
		},
	});
	// By default, SitemapAndIndexStream will partition sitemaps every 45,000 entries.
	const sitemapAndIndexStream = new SitemapAndIndexStream({
		getSitemapStream: (i) => {
			const sitemapPath = `./sitemap-${i}.xml`;
			const sitemapStream = new SitemapStream({
				hostname,
			});

			sitemapStream
				.pipe(createGzip())
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'number' is not assignable to type 'string | ... Remove this comment to see the full error message
				.pipe(uploadFromStream(getSitemapKey(community, { index: i })));

			return [new URL(sitemapPath, hostname).toString(), sitemapStream];
		},
	});
	const urls = pubs
		.map((pub) => ({
			url: pubUrl(community, pub),
			changefreq: 'weekly',
			priority: 1,
		}))
		.concat(
			pages.map((page) => ({
				url: pageUrl(community, page),
				changefreq: 'monthly',
				priority: 0.8,
			})),
		);

	await pipeline(
		stream.Readable.from(urls),
		sitemapAndIndexStream,
		createGzip(),
		uploadFromStream(getSitemapKey(community)),
	);

	return true;
};

const getSitemapIndex = async (community, targetFilename) => {
	await maybeGenerateSitemapIndex(community);

	const indexParams = {
		Key: getSitemapKey(community, { filename: targetFilename }),
	};

	// @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
	await s3.waitFor('objectExists', indexParams).promise();

	// @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
	return s3.getObject(indexParams).createReadStream();
};

app.get(
	'/sitemap.xml',
	wrap(async (req, res, next) => {
		if (!hostIsValid(req, 'community')) {
			return next();
		}

		const { communityData } = await getInitialData(req, { isDashboard: true });
		const sitemapFileStream = await getSitemapIndex(communityData, 'sitemap-index.xml');

		res.header('Content-Encoding', 'gzip');
		res.header('Content-Type', 'application/xml');

		return sitemapFileStream.pipe(res);
	}),
);

app.get(
	'/sitemap*',
	wrap(async (req, res, next) => {
		if (!hostIsValid(req, 'community')) {
			return next();
		}

		const { path } = req;
		const sitemapIndexOrSitemapFilename = path.replace(/^\//, '');

		if (!/^sitemap-([0-9]+|index)\.xml$/.test(sitemapIndexOrSitemapFilename)) {
			return res.sendStatus(404);
		}

		const { communityData } = await getInitialData(req, { isDashboard: true });
		const sitemapFileStream = await getSitemapIndex(
			communityData,
			sitemapIndexOrSitemapFilename,
		);

		if (sitemapFileStream) {
			res.header('Content-Encoding', 'gzip');
			res.header('Content-Type', 'application/xml');

			return sitemapFileStream.pipe(res);
		}

		return res.sendStatus(404);
	}),
);
