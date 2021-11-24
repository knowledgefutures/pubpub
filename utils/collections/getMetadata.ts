import { Collection } from 'types';
import { getSchemaForKind } from 'utils/collections/schemas';
import { formatDate, getLocalDateMatchingUtcCalendarDate, isValidDate } from 'utils/dates';

export const getOrderedCollectionMetadataFields = (collection: Collection) => {
	return getSchemaForKind(collection.kind)!.metadata;
};

const formatCalendarDate = (value: any, prefix: string) => {
	const date = new Date(value);
	if (isValidDate(date)) {
		const localDate = getLocalDateMatchingUtcCalendarDate(date);
		if (isValidDate(localDate)) {
			const localDateString = formatDate(localDate);
			return `${prefix}${localDateString}`;
		}
	}
	return null;
};

export const formattedMetadata = (field: string, value: string) => {
	if (field === 'printIssn') return `ISSN: ${value}`;
	if (field === 'electronicIssn') return `e-ISSN: ${value}`;
	if (field === 'volume') return `Volume ${value}`;
	if (field === 'issue') return `Issue ${value}`;
	if (field === 'printPublicationDate') return formatCalendarDate(value, 'Printed ');

	if (field === 'publicationDate') return formatCalendarDate(value, 'Published ');

	if (field === 'isbn') return `ISBN: ${value}`;
	if (field === 'copyrightYear') return `Copyright © ${value}`;
	if (field === 'edition') return `${value} ed.`;

	if (field === 'theme') return `${value}`;
	if (field === 'acronym') return ` ${value}`;
	if (field === 'location') return `${value}`;
	if (field === 'date') return formatCalendarDate(value, '');

	return value;
};
