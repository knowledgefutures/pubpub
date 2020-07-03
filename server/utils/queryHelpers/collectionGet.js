import { Collection, CollectionAttribution, includeUserModel } from 'server/models';

export const getCollection = async ({
	communityId,
	collectionId = null,
	collectionSlug = null,
}) => {
	const query = collectionId
		? { id: collectionId, communityId: communityId }
		: { slug: collectionSlug, communityId: communityId };
	return Collection.findOne({
		where: query,
		include: [
			{
				model: CollectionAttribution,
				as: 'attributions',
				include: [includeUserModel({ as: 'user' })],
			},
		],
	});
};
