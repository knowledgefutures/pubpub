import dateFormat from 'dateformat';

import contributors from './contributors';
import renderDate from './helpers/date';
import doiData from './doiData';
import isbn from './isbn';
import publisher from './publisher';

export default ({
	acronym,
	attributions,
	children,
	date,
	doi,
	location,
	theme,
	timestamp,
	title,
	url,
}) => ({
	conference: {
		...contributors(attributions),
		event_metadata: {
			conference_name: title,
			conference_theme: theme,
			conference_acronym: acronym,
			conference_location: location,
			conference_date: {
				'#text': dateFormat(date, 'yyyy-mm-dd'),
			},
		},
		proceedings_metadata: {
			proceedings_title: title,
			...publisher(),
			...renderDate('publication_date', date),
			...isbn(null, 'archive_volume'),
			...doiData(doi, timestamp, url),
		},
		...children,
	},
});
