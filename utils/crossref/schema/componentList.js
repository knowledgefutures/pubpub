import contributors from './contributors';
import doiData from './doiData';
import date from './helpers/date';

export default ({
	attributions,
	language,
	doi,
	publicationDate,
	resourceUrl,
	timestamp,
	title,
}) => ({
	component_list: {
		component: {
			'@language': language,
			'@parent_relation': 'isPartOf',
			titles: {
				title: title,
			},
			...contributors(attributions),
			...date('publication_date', publicationDate, 'print'),
			...doiData(doi, timestamp, resourceUrl),
		},
	},
});
