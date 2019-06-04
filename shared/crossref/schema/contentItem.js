import contributors from './contributors';
import date from './helpers/date';
import doiData from './doiData';

export default ({
	attributions,
	componentType,
	doi,
	getResourceUrl,
	publicationDate,
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
			// TODO(ian): Re-enable this for branches at some point?
			// ...componentList(sortedVersions, timestamp, getVersionDoi, getResourceUrl),
		},
	};
};
