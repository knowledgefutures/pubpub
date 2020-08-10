import contributors from './contributors';
import doiData from './doiData';
import date from './helpers/date';
import relations from './relations';

export default ({
	attributions,
	language,
	doi,
	publicationDate,
	resourceUrl,
	timestamp,
	title,
	relatedItems,
}) => ({
	posted_content: {
		'@xmlns:rel': 'http://www.crossref.org/relations.xsd',
		'@language': language,
		'@type': 'preprint',
		...contributors(attributions),
		titles: {
			title: title,
		},
		...date('posted_date', publicationDate, 'print'),
		...(relatedItems.length > 0 && relations(relatedItems)),
		...doiData(doi, timestamp, resourceUrl),
	},
});
