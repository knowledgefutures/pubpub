import { generateRanks } from 'utils/rank';
import { forEachInstance, forEach } from './util';

export const up = async ({ models }) => {
	const { Pub, CollectionPub } = models;
	await forEachInstance(
		Pub,
		async (pub) => {
			const collectionPubs = await CollectionPub.findAll({
				where: { pubId: pub.id },
			});
			collectionPubs.sort((a, b) => {
				if (a.isPrimary) {
					return -1;
				}
				if (b.isPrimary) {
					return 1;
				}
				return a.createdAt > b.createdAt ? 1 : -1;
			});
			const ranks = generateRanks(collectionPubs.length);
			forEach(
				collectionPubs,
				async (collectionPub, index) => {
					collectionPub.pubRank = ranks[index];
					await collectionPub.save();
				},
				10,
			);
		},
		10,
	);
};
