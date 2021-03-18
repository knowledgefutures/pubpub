import jp from 'jsonpath';
import sanitizeHtml from 'sanitize-html';
import { createObjectCsvWriter } from 'csv-writer';

import { CollectionPub } from 'server/models';
import { getPubDraftDoc } from 'server/utils/firebaseAdmin';

const {
	argv: { collectionId, file },
} = require('yargs');

const writer = createObjectCsvWriter({
	path: file,
	header: [
		{ id: 'caption', title: 'caption' },
		{ id: 'url', title: 'url' },
	],
});

const getFigureEntriesForPubId = async (pubId) => {
	const { doc } = await getPubDraftDoc(pubId);
	const imageNodes = jp.query(doc, `$..content[?(@.type=="image")]`);
	return imageNodes
		.map((image) => {
			const { url, caption } = image.attrs;
			const strippedCaption =
				caption &&
				sanitizeHtml(caption, {
					allowedTags: ['br'],
					allowedAttributes: {},
				});
			if (strippedCaption && strippedCaption.toLowerCase().startsWith('figure')) {
				return { caption: strippedCaption.split('<br />').join(' '), url };
			}
			return null;
		})
		.filter((x) => x);
};

const main = async () => {
	const collectionPubs = await CollectionPub.findAll({
		where: { collectionId },
		order: [['rank', 'ASC']],
	});

	const entriesByPub = await Promise.all(
		collectionPubs.map((cp) => getFigureEntriesForPubId(cp.pubId)),
	);

	const records = entriesByPub.reduce((a, b) => [...a, ...b]);
	writer.writeRecords(records);
};

main();
