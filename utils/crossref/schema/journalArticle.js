import contributors from './contributors';
import date from './helpers/date';
import doiData from './doiData';
import relations from './relations';

export default ({
	attributions,
	doi,
	publicationDate,
	resourceUrl,
	timestamp,
	title,
	relatedItems,
}) => {
	return {
		journal_article: {
			'@xmlns:rel': 'http://www.crossref.org/relations.xsd',
			'@publication_type': 'full_text',
			titles: {
				title: title,
			},
			...contributors(attributions),
			...date('publication_date', publicationDate),
			...(relatedItems.length > 0 && relations(relatedItems)),
			...doiData(doi, timestamp, resourceUrl),
		},
	};
};
