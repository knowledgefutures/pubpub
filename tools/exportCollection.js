
import fs from 'fs';
import fetch from 'node-fetch';

import { Collection, CollectionPub } from 'server/models';
import { getBestDownloadUrl } from 'utils/pub/downloads';
import { createPubExportsForLatestRelease } from 'server/export/queries';
import { getPubData } from 'server/rss/queries';

import { promptOkay } from './utils/prompt';

/* Usage: npm run tools exportCollection -- --collectionId=collectionId */

/* Warning: your IP may get blocked by Cloudflare, leading to bad PDF/XML
streams. The patch is to add your IP in cloudflare's IP list */

const {
	argv: { collectionId },
} = require('yargs');

const getPubExports = async (pubId, dest) => {
	const [pubData] = await getPubData([pubId]);
	const pdfUrl = getBestDownloadUrl(pubData, 'pdf');
	const jatsUrl = getBestDownloadUrl(pubData, 'jats');
	const finalDest = `${dest}/${pubData.slug}`;

	if (!pdfUrl || !jatsUrl) {
		console.log('Missing:', pubData.slug);
		await createPubExportsForLatestRelease(pubId);
		await getPubExports(pubId, dest);
	} else {
		fs.mkdirSync(finalDest);
		if (jatsUrl) {
			await fetch(jatsUrl).then((res) => {
				res.body.pipe(fs.createWriteStream(`${finalDest}/${pubData.slug}.xml`));
			});
		}
		if (pdfUrl) {
			await fetch(pdfUrl).then((res) => {
				res.body.pipe(fs.createWriteStream(`${finalDest}/${pubData.slug}.pdf`));
			});
		}
	}
	return Promise.resolve();
};

const main = async () => {
	const query = {
		include: [
			{
				model: CollectionPub,
				as: 'collectionPubs',
				attributes: ['pubId'],
			},
		],
		where: { id: collectionId },
	};
	try {
		const collection = await Collection.findOne(query);
		await promptOkay(`Export ${collection.collectionPubs.length} pubs?`, {
			yesIsDefault: false,
			throwIfNo: true,
		});
		const dest = `/tmp/${collection.slug}`;
		if (fs.existsSync(dest)) {
			fs.rmdirSync(dest, { recursive: true });
		}
		fs.mkdirSync(dest);
		await Promise.all(
			collection.collectionPubs.map((collectionPub) =>
				getPubExports(collectionPub.pubId, dest),
			),
		);
	} catch (err) {
		console.warn(err);
	}
};

main().finally(() => process.exit(0));
