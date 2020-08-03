import contributors from './contributors';
import date from './helpers/date';
import doiData from './doiData';
import relations from './relations';

export default ({
	attributions,
	componentType,
	doi,
	publicationDate,
	resourceUrl,
	timestamp,
	title,
	relatedItems,
	contentVersion,
}) => {
	return {
		content_item: {
			'@xmlns:rel': 'http://www.crossref.org/relations.xsd',
			'@component_type': componentType,
			...contributors(attributions),
			titles: {
				title: title,
			},
			...date('publication_date', publicationDate),
			...(relatedItems.length > 0 && relations(relatedItems)),
			...doiData(doi, timestamp, resourceUrl, contentVersion),
		},
	};
};
