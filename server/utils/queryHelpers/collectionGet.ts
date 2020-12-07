import { Collection, CollectionAttribution, includeUserModel } from 'server/models';

import { stripFalsyIdsFromQuery } from './util';

export const getCollection = async ({
	communityId,
	collectionId = null,
	collectionSlug = null,
}) => {
	return Collection.findOne({
		where: stripFalsyIdsFromQuery({
			id: collectionId,
			slug: collectionSlug,
			communityId: communityId,
		}),
		include: [
			{
				model: CollectionAttribution,
				as: 'attributions',
				// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ as: string; }' is not assignab... Remove this comment to see the full error message
				include: [includeUserModel({ as: 'user' })],
			},
		],
	});
};
