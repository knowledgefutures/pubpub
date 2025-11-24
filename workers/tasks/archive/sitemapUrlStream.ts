import { PassThrough, Readable } from 'node:stream';
import { SaxesParser } from 'saxes';

const urlPattern = /https?[^<]+/g;

export const createSitemapUrlStreams = async (communityUrl: string, n: number) => {
	const sitemapUrl = new URL('/sitemap-0.xml', communityUrl);
	const sitemapResponse = await fetch(sitemapUrl, {
		headers: {
			'User-Agent': 'PubPub-Archive-Bot/1.0',
		},
	});

	const urlStreams = Array.from({ length: n }, () => new PassThrough());

	let i = 0;

	const xmlStream = Readable.fromWeb(sitemapResponse.body!);
	const xmlParser = new SaxesParser();

	xmlStream.on('data', (chunk) => {
		xmlParser.write(chunk.toString());
	});

	xmlStream.on('end', () => {
		xmlParser.close();
	});

	xmlParser.on('text', (text) => {
		if (urlPattern.test(text)) {
			urlStreams[i++ % urlStreams.length].push(text);
		}
	});

	xmlParser.on('end', () => {
		for (const urlStream of urlStreams) {
			urlStream.end();
		}
	});

	return urlStreams;
};
