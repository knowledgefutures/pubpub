import { Op } from 'sequelize';
import findRank from 'shared/utils/findRank';
import { Collection, CollectionPub, sequelize } from '../models';
import { getCollectionPubsInCollection } from '../utils/collectionQueries';

export const createCollectionPub = (inputValues) => {
	return Promise.all([
		Collection.findOne({ where: { id: inputValues.collectionId } }),
		CollectionPub.findAll({
			where: { pubId: inputValues.pubId },
			include: [{ model: Collection, as: 'collection' }],
		}),
		getCollectionPubsInCollection(inputValues.collectionId),
	]).then(([collection, pubLevelPeers, collectionLevelPeers]) => {
		// If this is the first non-tag collection in the bunch, make it the primary one
		const isPrimary =
			pubLevelPeers.filter((peer) => peer.collection.kind !== 'tag').length === 0 &&
			collection.kind !== 'tag';
		// If a rank wasn't provided, move the CollectionPub to the end of the collection
		let setRank = inputValues.rank;
		if (!setRank) {
			const ranks = collectionLevelPeers.map((cp) => cp.rank).filter((r) => r);
			// eslint-disable-next-line no-param-reassign
			setRank = findRank(ranks, ranks.length);
		}
		return CollectionPub.create(
			{
				collectionId: inputValues.collectionId,
				pubId: inputValues.pubId,
				rank: inputValues.rank,
				isPrimary: isPrimary,
			},
			/* Unclear why this is included */
			{ returning: true },
		);
	});
};

export const setPrimaryCollectionPub = (inputValues) => {
	return CollectionPub.findOne({
		where: { id: inputValues.collectionPubId },
		include: [{ model: Collection, as: 'collection' }],
	}).then((collectionPub) => {
		return (
			collectionPub.collection.isPublic &&
			sequelize.transaction((txn) => {
				return CollectionPub.update(
					{ isPrimary: false },
					{
						transaction: txn,
						where: {
							pubId: collectionPub.pubId,
							id: { [Op.ne]: inputValues.collectionPubId },
						},
					},
				).then(() => {
					return CollectionPub.update(
						{ isPrimary: true },
						{
							where: { id: inputValues.collectionPubId },
							returning: true,
							transaction: txn,
						},
					);
				});
			})
		);
	});
};

export const updateCollectionPub = (inputValues, updatePermissions) => {
	// Filter to only allow certain fields to be updated
	const filteredValues = {};
	Object.keys(inputValues).forEach((key) => {
		if (updatePermissions.includes(key)) {
			filteredValues[key] = inputValues[key];
		}
	});

	return CollectionPub.update(filteredValues, {
		where: { id: inputValues.collectionPubId },
		/* Unclear why this is included */
		returning: true,
	}).then(() => {
		return filteredValues;
	});
};

export const destroyCollectionPub = (inputValues) => {
	return CollectionPub.destroy({
		where: { id: inputValues.collectionPubId },
	});
};
