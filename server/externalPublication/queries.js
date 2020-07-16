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
		title: title,
		url: url,
		contributors: contributors,
		doi: doi,
		description: description,
		avatar: avatar,
		publicationDate: publicationDate,
	});
};
