import componentList from './componentList';
import contributors from './contributors';
import doiData from './doiData';

export default ({
	attributions,
	doi,
	getResourceUrl,
	getVersionDoi,
	language,
	sortedVersions,
	timestamp,
	title,
}) => {
	return {
		conference_paper: {
			'@language': language,
			...contributors(attributions),
			titles: {
				title: title,
			},
			...doiData(doi, timestamp, getResourceUrl()),
			...componentList(sortedVersions, timestamp, getVersionDoi, getResourceUrl),
		},
	};
};
