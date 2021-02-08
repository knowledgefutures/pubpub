import contributors from './contributors';
import doiData from './doiData';
import relations from './relations';

export default ({
	attributions,
	doi,
	language,
	resourceUrl,
	timestamp,
	title,
	relatedItems,
	contentVersion,
}) => {
	return {
		conference_paper: {
			'@xmlns:rel': 'http://www.crossref.org/relations.xsd',
			'@language': language,
			...contributors(attributions),
			titles: {
				title,
			},
			...(relatedItems.length > 0 && relations(relatedItems)),
			...doiData(doi, timestamp, resourceUrl, contentVersion),
		},
	};
};
