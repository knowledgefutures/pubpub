import { Collection } from 'types';
import { getSchemaForKind } from 'utils/collections/schemas';
import { formatDate } from 'utils/dates';

export const getOrderedCollectionMetadataFields = (collection: Collection) => {
	return getSchemaForKind(collection.kind)!.metadata;
};

export const formattedMetadata = (field: any, data: any) => {
	if (field === 'printIssn') return `ISSN: ${data}`;
	if (field === 'electronicIssn') return `e-ISSN: ${data}`;
	if (field === 'volume') return `Volume ${data}`;
	if (field === 'issue') return `Issue ${data}`;
	if (field === 'printPublicationDate') return `Printed ${formatDate(data)}`;

	if (field === 'publicationDate') return `Published ${formatDate(data)}`;

	if (field === 'isbn') return `ISBN: ${data}`;
	if (field === 'copyrightYear') return `Copyright © ${data}`;
	if (field === 'edition') return `${data} ed.`;

	if (field === 'theme') return `${data}`;
	if (field === 'acronym') return ` ${data}`;
	if (field === 'location') return `${data}`;
	if (field === 'date') return `${formatDate(data)}`;

	return data;
};
