import { ExternalPublication } from 'server/models';

export const createExternalPublication = ({
	title,
	url,
	byline = null,
	doi = null,
	description = null,
	avatar = null,
	publicationDate = null,
}) => {
	return ExternalPublication.create({
		title: title,
		url: url,
		byline: byline,
		doi: doi,
		description: description,
		avatar: avatar,
		publicationDate: publicationDate,
	});
};
