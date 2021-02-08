import { ExternalPublication } from 'server/models';

export const createExternalPublication = ({
	title,
	url,
	contributors = null,
	doi = null,
	description = null,
	avatar = null,
	publicationDate = null,
}) => {
	return ExternalPublication.create({
		title,
		url,
		contributors,
		doi,
		description,
		avatar,
		publicationDate,
	});
};
