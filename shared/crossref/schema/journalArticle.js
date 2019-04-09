import componentList from './componentList';
import contributors from './contributors';
import date from './helpers/date';
import doiData from './doiData';

export default ({
	attributions,
	doi,
	getResourceUrl,
	getVersionDoi,
	publicationDate,
	sortedVersions,
	timestamp,
	title,
}) => {
	return {
		journal_article: {
			'@publication_type': 'full_text',
			titles: {
				title: title,
			},
			...contributors(attributions),
			...date('publication_date', publicationDate),
			...doiData(doi, timestamp, getResourceUrl()),
			...componentList(sortedVersions, timestamp, getVersionDoi, getResourceUrl),
		},
	};
};
