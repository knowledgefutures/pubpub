import contributors from './contributors';
import doiData from './doiData';

export default ({ attributions, doi, getResourceUrl, language, timestamp, title }) => {
	return {
		conference_paper: {
			'@language': language,
			...contributors(attributions),
			titles: {
				title: title,
			},
			...doiData(doi, timestamp, getResourceUrl()),
			// TODO(ian): Re-enable this for branches at some point?
			// ...componentList(sortedVersions, timestamp, getVersionDoi, getResourceUrl),
		},
	};
};
