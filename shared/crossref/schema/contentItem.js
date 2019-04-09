import componentList from './componentList';
import contributors from './contributors';
import date from './helpers/date';
import doiData from './doiData';

export default ({
	attributions,
	componentType,
	doi,
	getResourceUrl,
	getVersionDoi,
	publicationDate,
	sortedVersions,
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
			...doiData(doi, timestamp, getResourceUrl()),
			...componentList(sortedVersions, timestamp, getVersionDoi, getResourceUrl),
		},
	};
};
