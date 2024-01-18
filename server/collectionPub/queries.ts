import { findRank } from 'utils/rank';
import {
	Collection,
	CollectionPub,
	Member,
	Pub,
	PubAttribution,
	Release,
	includeUserModel,
	CollectionAttribution,
} from 'server/models';
import * as types from 'types';
import { getCollectionPubsInCollection } from 'server/utils/collectionQueries';
import { expect } from 'utils/assert';
import { CollectionPubQueryInput } from './schemas';

export const getPubsInCollection = async ({
	collectionId,
	communityId,
	userId,
	limit,
	offset,
}: CollectionPubQueryInput & { userId?: string | null }) => {
	const collectionPubsQuery = CollectionPub.findAll({
		where: { collectionId: collectionId ?? null },
		order: [['rank', 'ASC']],
		include: [
			{
				model: Pub,
				as: 'pub',
				include: [
					{ model: Release, as: 'releases', attributes: ['id'] },
					{
						model: CollectionPub,
						as: 'collectionPubs',
						separate: true,
						include: [
							{
								model: Collection,
								as: 'collection',
								include: [
									{
										model: CollectionAttribution,
										as: 'attributions',
										include: [includeUserModel({ as: 'user' })],
									},
								],
							},
						],
					},
					{
						model: PubAttribution,
						as: 'attributions',
						include: [includeUserModel({ as: 'user' })],
					},
				],
			},
		],
		limit,
		offset,
	});
	const membersQuery = userId ? Member.findAll({ where: { userId } }) : [];
	const [collectionPubs, members] = await Promise.all([collectionPubsQuery, membersQuery]);
	const isCommunityMember = members.some((member) => member.communityId === communityId);
	const isCollectionMember = members.some((member) => member.collectionId === collectionId);

	return collectionPubs
		.map((cp) => cp.pub?.toJSON())
		.filter(
			(pub): pub is types.Pub =>
				!!pub &&
				(isCommunityMember ||
					isCollectionMember ||
					members.some((m) => m.pubId === pub.id) ||
					expect(pub.releases).length > 0),
		);
};

const getRankInPeers = (requestedRank: string | null, ranks: string[], moveToTop = false) => {
	if (requestedRank) {
		return requestedRank;
	}
	const targetIndex = moveToTop ? 0 : ranks.length;
	return findRank(ranks, targetIndex);
};

export const createCollectionPub = async ({
	collectionId,
	pubId,
	rank = null,
	pubRank = null,
	moveToTop = false,
	isPrimary = false,
	actorId = null,
}: {
	collectionId: string;
	pubId: string;
	rank?: string | null;
	pubRank?: string | null;
	moveToTop?: boolean;
	isPrimary?: boolean;
	actorId?: string | null;
}) => {
	const [pubLevelPeers, collectionLevelPeers] = await Promise.all([
		CollectionPub.findAll({
			where: { pubId },
			include: [{ model: Collection, as: 'collection' }],
		}),
		getCollectionPubsInCollection(collectionId),
	]);
	return CollectionPub.create(
		{
			collectionId,
			pubId,
			rank: getRankInPeers(
				rank,
				collectionLevelPeers.map((cp) => cp.rank),
				moveToTop,
			),
			pubRank: getRankInPeers(
				pubRank,
				pubLevelPeers.map((cp_1) => cp_1.pubRank),
				isPrimary,
			),
		},
		{ actorId },
	);
};

export const updateCollectionPub = (collectionPubId: string, inputValues, updatableFields) => {
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

export const destroyCollectionPub = (collectionPubId: string, actorId: string | null = null) => {
	return CollectionPub.destroy({
		where: { id: collectionPubId },
		actorId,
		individualHooks: true,
	});
};
