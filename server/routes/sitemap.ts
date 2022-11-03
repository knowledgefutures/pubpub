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
import { createPubPubS3Client } from 'server/utils/s3';

const s3 = createPubPubS3Client({
	accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
	bucket: 'sitemaps.pubpub.org',
	ACL: 'public-read',
});

const pipeline = promisify(stream.pipeline);
const keyPrefix = isProd() ? 'prod' : 'dev';

const uploadFromStream = (key) => {
	const pass = new stream.PassThrough();
	s3.uploadFile(key, pass, true)
		.then(() => pass.end())
		.catch((err) => console.error(err));
	return pass;
};

// @ts-expect-error ts-migrate(2525) FIXME: Initializer provides no value for this binding ele... Remove this comment to see the full error message
const getSitemapKey = (community, { filename, index = 'index' } = {}) =>
	`${keyPrefix}/${community.id}/${filename || `sitemap-${index}.xml`}.gz`;

const shouldGenerateSitemapIndex = async (community) => {
	const sitemapKey = getSitemapKey(community);
	const metadata = await s3.retrieveFileHead(sitemapKey);
	if (metadata) {
		const { LastModified: lastModified } = metadata;
		if (lastModified) {
			return Date.now() - lastModified.valueOf() >= 8.64e7;
		}
	}
	return true;
};

const maybeGenerateSitemapIndex = async (community) => {
	const shouldGenerate = await shouldGenerateSitemapIndex(community);
	if (!shouldGenerate) {
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
	const sitemapKey = getSitemapKey(community, { filename: targetFilename });
	await s3.waitForFileToExist(sitemapKey, 15);
	return s3.downloadFile(sitemapKey);
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
