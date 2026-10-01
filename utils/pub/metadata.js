import { getAbstractText } from 'utils/pub/abstract';
import { getBestDownloadUrl } from 'utils/pub/downloads';
import { pubUrl } from 'utils/canonicalUrls';

export const getPdfDownloadUrl = (communityData, pubData) => {
	const hasPdfDownload = !!getBestDownloadUrl(pubData, 'pdf');
	if (hasPdfDownload) {
		return pubUrl(communityData, pubData, { download: 'pdf' });
	}
	return null;
};

/**
 * Kept as a re-export so existing callers are unchanged. The implementation
 * moved to utils/pub/abstract.ts, which is now the single definition of the
 * abstract convention — this file used to carry a second, subtly different copy
 * of the match (no trim, unguarded attrs, hard_breaks dropped). See that module.
 */
export const getTextAbstract = getAbstractText;

const noteTypes = {
	chapter: 'book',
	book: 'book',
	proceedings: 'conference',
	'paper-conference': 'conference',
};

export const getGoogleScholarNotes = (notes) => {
	return notes
		.filter((note) => note.json !== '' && !!note.json[0] && !note.error)
		.reduce((unique, note) => {
			const noteArray = [];
			const noteType = note.json[0].type;
			const noteTypeString = noteTypes[noteType] || 'journal';

			Object.entries(note.json[0]).forEach(([key, value]) => {
				switch (key) {
					case 'title':
						noteArray.push(`citation_title=${value}`);
						break;
					case 'author':
						value.forEach((author) => {
							const authorText = author.literal || `${author.given} ${author.family}`;
							noteArray.push(`citation_author=${authorText}`);
						});
						break;
					case 'container-title':
						noteArray.push(`citation_${noteTypeString}_title=${value}`);
						break;
					case 'issued':
						if (value['date-parts']) {
							noteArray.push(
								`citation_publication_date=${value['date-parts'][0].join('/')}`,
							);
						}
						break;
					case 'issue':
					case 'volume':
					case 'DOI':
					case 'ISSN':
					case 'ISBN':
						noteArray.push(`citation_${key}=${value}`);
						break;
					default:
						break;
				}
			});
			return unique.includes(noteArray.join(';')) ? unique : [...unique, noteArray.join(';')];
		}, []);
};

export const getWordAndCharacterCountsFromDoc = (node) => {
	const text = node.textBetween(0, node.content.size, ' ', ' ');
	const words = text.split(' ').filter((word) => word !== '');
	return [words.length, text.length];
};
