import contributors from './contributors';
import doiData from './doiData';

export default ({ attributions, doi, language, resourceUrl, timestamp, title }) => {
	return {
		conference_paper: {
			'@language': language,
			...contributors(attributions),
			titles: {
				title: title,
			},
			...doiData(doi, timestamp, resourceUrl),
		},
	};
};
