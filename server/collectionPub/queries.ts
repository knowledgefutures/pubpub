import { findRank } from 'utils/rank';
import {
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

const getRankInPeers = (requestedRank: string | null, ranks: string[], moveToTop = false) => {
	if (requestedRank) {
		return requestedRank;
	}
	const targetIndex = moveToTop ? 0 : ranks.length;
	return findRank(ranks, targetIndex);
};

export const createCollectionPub = ({
	collectionId,
	pubId,
	rank = null,
	pubRank = null,
	moveToTop = false,
	isPrimary = false,
}) => {
	return Promise.all([
		CollectionPub.findAll({
			where: { pubId: pubId },
			include: [{ model: Collection, as: 'collection' }],
		}),
		getCollectionPubsInCollection(collectionId),
	]).then(([pubLevelPeers, collectionLevelPeers]) => {
		return CollectionPub.create({
			collectionId: collectionId,
			pubId: pubId,
			rank: getRankInPeers(
				rank,
				collectionLevelPeers.map((cp) => cp.rank),
				moveToTop,
			),
			pubRank: getRankInPeers(
				pubRank,
				pubLevelPeers.map((cp) => cp.pubRank),
				isPrimary,
			),
		});
	});
};

export const updateCollectionPub = (collectionPubId, inputValues, updatableFields) => {
	const filteredValues = {};
	Object.keys(inputValues).forEach((key) => {
		if (updatableFields.includes(key)) {
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

export const destroyCollectionPub = (collectionPubId) => {
	return CollectionPub.destroy({
		where: { id: collectionPubId },
	});
};
