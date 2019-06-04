import contributors from './contributors';
import date from './helpers/date';
import doiData from './doiData';

export default ({ attributions, doi, getResourceUrl, publicationDate, timestamp, title }) => {
	return {
		journal_article: {
			'@publication_type': 'full_text',
			titles: {
				title: title,
			},
			...contributors(attributions),
			...date('publication_date', publicationDate),
			...doiData(doi, timestamp, getResourceUrl()),
			// TODO(ian): Re-enable this for branches at some point?
			// ...componentList(sortedVersions, timestamp, getVersionDoi, getResourceUrl),
		},
	};
};
