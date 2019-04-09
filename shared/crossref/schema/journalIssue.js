import date from './helpers/date';
import contributors from './contributors';
import doiData from './doiData';

export default ({ title, attributions, volume, issue, publicationDate, doi, timestamp, url }) => ({
	journal_issue: {
		...contributors(attributions),
		titles: {
			title: title,
		},
		...date('publication_date', publicationDate),
		...(volume
			? {
					journal_volume: {
						volume: volume,
					},
			  }
			: {}),
		issue: issue,
		...doiData(doi, timestamp, url),
	},
});
