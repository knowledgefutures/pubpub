import ensureUserForAttribution from 'utils/ensureUserForAttribution';
import { generateRanks, sortByRank } from 'utils/rank';
import { CollectionAttribution, CollectionPub, includeUserModel } from 'server/models';

export const getCollectionAttributions = (collectionId) =>
	CollectionAttribution.findAll({
		where: { collectionId },
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
		where: { collectionId },
		order: [['rank', 'ASC']],
	});

export const rerankCollection = async (collectionId) => {
	const collectionPubs = await getCollectionPubsInCollection(collectionId);
	const orderedCollectionPubs = sortByRank(collectionPubs);
	const ranks = generateRanks(orderedCollectionPubs.length);
	await Promise.all(
		orderedCollectionPubs.map((collectionPub, index) =>
			// @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
			CollectionPub.update({ rank: ranks[index] }, { where: { id: collectionPub.id } }),
		),
	);
};
