import { Collection, CollectionAttribution, User } from '../../models';

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
				include: [{ model: User, as: 'user' }],
			},
		],
	});
};
