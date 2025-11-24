import { CollectionAttribution, CollectionPub, includeUserModel } from 'server/models';
import ensureUserForAttribution from 'utils/ensureUserForAttribution';
import { generateRanks, sortByRank } from 'utils/rank';

export const getCollectionAttributions = (collectionId: string) =>
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

export const getCollectionPubsInCollection = (collectionId: string) =>
	CollectionPub.findAll({
		where: { collectionId },
		order: [['rank', 'ASC']],
	});

export const rerankCollection = async (collectionId: string) => {
	const collectionPubs = await getCollectionPubsInCollection(collectionId);
	const orderedCollectionPubs = sortByRank(collectionPubs);
	const ranks = generateRanks(orderedCollectionPubs.length);
	await Promise.all(
		orderedCollectionPubs.map((collectionPub, index) =>
			CollectionPub.update({ rank: ranks[index] }, { where: { id: collectionPub.id } }),
		),
	);
};
