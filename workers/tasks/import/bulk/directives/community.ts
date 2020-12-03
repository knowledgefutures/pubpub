import { generateHash } from 'utils/hashes';
import { createCommunity } from 'server/community/queries';
import { Community } from 'server/models';

import { BulkImportError } from '../errors';

const findOrCreateCommunity = async (directive, actor) => {
	const { title, description, subdomain, accentColorDark, accentColorLight } = directive;
	if (directive.create) {
		const { subdomain: createdSubdomain } = await createCommunity(
			{
				title: title || 'Imported Community',
				description: description || 'This Community was created with the bulk importer',
				subdomain: subdomain || generateHash(6),
				accentColorDark: accentColorDark || 'black',
				accentColorLight: accentColorLight || 'white',
			},
			actor,
			false,
		);
		return Community.findOne({ where: { subdomain: createdSubdomain } });
	}
	const foundCommunity = Community.findOne({ where: { subdomain: directive.subdomain } });
	if (!foundCommunity) {
		throw new BulkImportError(
			{ directive: directive },
			`No existing Community with subdomain ${directive.subdomain}. If you meant to create one, use "create: true"`,
		);
	}
	return foundCommunity;
};

export const resolveCommunityDirective = async ({ directive, actor }) => {
	const community = await findOrCreateCommunity(directive, actor);
	return {
		community: community,
		created: directive.create,
	};
};
