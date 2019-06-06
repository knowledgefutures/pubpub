import contributors from './contributors';
import date from './helpers/date';
import doiData from './doiData';

export default ({ attributions, doi, publicationDate, resourceUrl, timestamp, title }) => {
	return {
		journal_article: {
			'@publication_type': 'full_text',
			titles: {
				title: title,
			},
			...contributors(attributions),
			...date('publication_date', publicationDate),
			...doiData(doi, timestamp, resourceUrl),
		},
	};
};
