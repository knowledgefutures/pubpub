import { Op } from 'sequelize';

import findRank from 'shared/utils/findRank';
import { Collection, CollectionPub, sequelize } from '../models';
import { getCollectionPubsInCollection } from '../utils/collectionQueries';
import { getScope, getOverview, sanitizeOverview } from '../utils/queryHelpers';

export const getCollectionPubs = async ({ communityId, collectionId, userId }) => {
	const scopeData = await getScope({
		communityId: communityId,
		collectionId: collectionId,
		loginId: userId,
	});
	const overviewData = await getOverview({ scopeData: scopeData });
	const { pubs, collections } = sanitizeOverview(
		{ loginData: { id: userId }, scopeData: scopeData },
		overviewData,
	);
	const collection = collections.find((col) => col.id === collectionId);
	if (collection) {
		return collection.collectionPubs
			.map((cp) => pubs.find((pub) => pub.id === cp.pubId))
			.filter((x) => x);
	}
	return [];
};

export const createCollectionPub = ({ collectionId, pubId, rank, moveToTop = false }) => {
	return Promise.all([
		Collection.findOne({ where: { id: collectionId } }),
		CollectionPub.findAll({
			where: { pubId: pubId },
			include: [{ model: Collection, as: 'collection' }],
		}),
		getCollectionPubsInCollection(collectionId),
	]).then(([collection, pubLevelPeers, collectionLevelPeers]) => {
		// If this is the first non-tag collection in the bunch, make it the primary one
		const isPrimary =
			pubLevelPeers.filter((peer) => peer.collection.kind !== 'tag').length === 0 &&
			collection.kind !== 'tag' &&
			collection.isPublic;
		// If a rank wasn't provided, move the CollectionPub to the top or bottom of the collection
		let setRank = rank;
		if (!setRank) {
			const ranks = collectionLevelPeers.map((cp) => cp.rank).filter((r) => r);
			// eslint-disable-next-line no-param-reassign
			const targetIndex = moveToTop ? 0 : ranks.length;
			setRank = findRank(ranks, targetIndex);
		}
		return CollectionPub.create({
			collectionId: collectionId,
			pubId: pubId,
			rank: setRank,
			isPrimary: isPrimary,
		});
	});
};

export const setPrimaryCollectionPub = ({ collectionPubId, isPrimary }) => {
	return CollectionPub.findOne({
		where: { id: collectionPubId },
		include: [{ model: Collection, as: 'collection' }],
	}).then((collectionPub) => {
		return (
			(!collectionPubId || collectionPub.collection.isPublic) &&
			sequelize.transaction((txn) => {
				return CollectionPub.update(
					{ isPrimary: false },
					{
						transaction: txn,
						where: {
							pubId: collectionPub.pubId,
							id: { [Op.ne]: collectionPubId },
						},
					},
				).then(() => {
					return CollectionPub.update(
						{ isPrimary: isPrimary },
						{
							where: { id: collectionPubId },
							returning: true,
							transaction: txn,
						},
					);
				});
			})
		);
	});
};

export const updateCollectionPub = ({ collectionPubId, ...inputValues }, updatePermissions) => {
	// Filter to only allow certain fields to be updated
	const filteredValues = {};
	Object.keys(inputValues).forEach((key) => {
		if (updatePermissions.includes(key)) {
			filteredValues[key] = inputValues[key];
		}
	});

	return CollectionPub.update(filteredValues, {
		where: { id: collectionPubId },
		returning: true,
	}).then(() => {
		return filteredValues;
	});
};

export const destroyCollectionPub = ({ collectionPubId }) => {
	return CollectionPub.destroy({
		where: { id: collectionPubId },
	});
};
