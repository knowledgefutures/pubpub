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
	contentVersion,
	reviewType,
	reviewRecommendation,
}) => ({
	peer_review: {
		'@xmlns:rel': 'http://www.crossref.org/relations.xsd',
		'@language': language,
		'@type': reviewType,
		'@recommendation': reviewRecommendation,
		...contributors(attributions),
		titles: {
			title: title,
		},
		...date('review_date', publicationDate, null),
		...(relatedItems.length > 0 && relations(relatedItems)),
		...doiData(doi, timestamp, resourceUrl, contentVersion),
	},
});
