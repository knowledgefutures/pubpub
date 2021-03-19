import fs from 'fs';
import jp from 'jsonpath';
import sanitizeHtml from 'sanitize-html';
import dedent from 'dedent';

import { Pub, CollectionPub } from 'server/models';
import { getPubDraftDoc } from 'server/utils/firebaseAdmin';

const {
	argv: { collectionId, file },
} = require('yargs');

const figureRegex = /^(figure [0-9]+)(.*)/i;

const getReferenceUrl = (pub, nodeId) => {
	return `/pub/${pub.slug}#${nodeId}`;
};

const getFigureEntriesForPubId = async (pub) => {
	const { doc } = await getPubDraftDoc(pub.id);
	const imageNodes = jp.query(doc, `$..content[?(@.type=="image")]`);
	return imageNodes
		.map((image) => {
			const { url, caption, id } = image.attrs;
			const referenceUrl = getReferenceUrl(pub, id);
			const strippedCaption =
				caption &&
				sanitizeHtml(caption, {
					allowedTags: [],
					allowedAttributes: {},
				});
			if (strippedCaption) {
				const match = strippedCaption.match(figureRegex);
				if (match) {
					const [_, figureText, captionText] = match;
					return { url, referenceUrl, figureText, captionText };
				}
			}
			return null;
		})
		.filter((x) => x);
};

const getHtmlEntry = (entry) => {
	const { url, referenceUrl, figureText, captionText } = entry;
	return dedent`<p>
		<a href="${url}" target="_blank"><b>${figureText}:</b></a> 
		${captionText} 
		<a href="${referenceUrl}">
			[visit Pub ↗]
		</a>
	</p>
	`;
};

const main = async () => {
	const collectionPubs = await CollectionPub.findAll({
		where: { collectionId },
		include: [{ model: Pub, as: 'pub' }],
		order: [['rank', 'ASC']],
	});

	const entriesByPub = await Promise.all(
		collectionPubs.map((cp) => getFigureEntriesForPubId(cp.pub)),
	);

	const entries = entriesByPub.reduce((a, b) => [...a, ...b]);
	const htmlString = entries.map(getHtmlEntry).join('\n\n');
	fs.writeFileSync(file, htmlString);
	// eslint-disable-next-line no-console
	console.log('done');
};

main();
