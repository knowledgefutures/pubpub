import ensureUserForAttribution from 'utils/ensureUserForAttribution';
import { User, CollectionAttribution, CollectionPub } from 'server/models';

export const getCollectionAttributions = (collectionId) =>
	CollectionAttribution.findAll({
		where: { collectionId: collectionId },
		include: [
			{
				model: User,
				as: 'user',
				required: false,
				attributes: [
					'id',
					'firstName',
					'lastName',
					'fullName',
					'avatar',
					'slug',
					'initials',
					'title',
				],
			},
		],
	}).then((attributions) => {
		return attributions.map((attribution) => {
			const attributionJson = attribution.toJSON();
			if (attribution.user) {
				return attributionJson;
			}
			return ensureUserForAttribution(attributionJson);
		});
	});

export const getCollectionPubsInCollection = (collectionId) =>
	CollectionPub.findAll({
		where: { collectionId: collectionId },
		order: [['rank', 'ASC']],
	});
