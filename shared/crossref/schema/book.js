import contributors from './contributors';
import date from './helpers/date';
import doiData from './doiData';
import publisher from './publisher';
import renderIsbn from './isbn';

export default ({
	attributions,
	children,
	doi,
	edition,
	isbn,
	publicationDate,
	timestamp,
	title,
	url,
}) => {
	return {
		book: {
			// TODO(ian): find out what book_type we should actually be using
			'@book_type': 'other',
			book_metadata: {
				...contributors(attributions),
				titles: {
					title: title,
				},
				edition_number: edition || '1',
				...date('publication_date', publicationDate),
				...renderIsbn(isbn),
				...publisher(),
				...doiData(doi, timestamp, url),
			},
			...children,
		},
	};
};
