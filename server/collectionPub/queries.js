import { Op } from 'sequelize';

import { findRank } from 'utils/rank';
import {
	sequelize,
	Collection,
	CollectionPub,
	Member,
	Pub,
	PubAttribution,
	Release,
	includeUserModel,
} from 'server/models';
import { getCollectionPubsInCollection } from 'server/utils/collectionQueries';

export const getPubsInCollection = async ({ communityId, collectionId, userId }) => {
	const collectionPubsQuery = CollectionPub.findAll({
		where: { collectionId: collectionId },
		order: [['rank', 'ASC']],
		include: [
			{
				model: Pub,
				as: 'pub',
				include: [
					{ model: Release, as: 'releases', attributes: ['id'] },
					{
						model: PubAttribution,
						as: 'attributions',
						include: [includeUserModel({ as: 'user' })],
					},
				],
			},
		],
	});
	const membersQuery = userId ? Member.findAll({ where: { userId: userId } }) : [];
	const [collectionPubs, members] = await Promise.all([collectionPubsQuery, membersQuery]);
	const isCommunityMember = members.some((member) => member.communityId === communityId);
	const isCollectionMember = members.some((member) => member.collectionId === collectionId);

	return collectionPubs
		.map((cp) => cp.pub)
		.filter(
			(pub) =>
				isCommunityMember ||
				isCollectionMember ||
				members.some((m) => m.pubId === pub.id) ||
				pub.releases.length > 0,
		);
};

export const createCollectionPub = ({
	collectionId,
	pubId,
	rank,
	isPrimary: forceIsPrimary,
	moveToTop = false,
}) => {
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
			isPrimary: forceIsPrimary || isPrimary,
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
