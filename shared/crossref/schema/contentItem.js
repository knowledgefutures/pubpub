import contributors from './contributors';
import date from './helpers/date';
import doiData from './doiData';

export default ({
	attributions,
	componentType,
	doi,
	publicationDate,
	resourceUrl,
	timestamp,
	title,
}) => {
	return {
		content_item: {
			'@component_type': componentType,
			...contributors(attributions),
			titles: {
				title: title,
			},
			...date('publication_date', publicationDate),
			...doiData(doi, timestamp, resourceUrl),
		},
	};
};
