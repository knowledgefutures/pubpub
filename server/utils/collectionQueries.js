import ensureUserForAttribution from 'utils/ensureUserForAttribution';
import { CollectionAttribution, CollectionPub, includeUserModel } from 'server/models';

export const getCollectionAttributions = (collectionId) =>
	CollectionAttribution.findAll({
		where: { collectionId: collectionId },
		include: [includeUserModel({ as: 'user', required: false })],
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
