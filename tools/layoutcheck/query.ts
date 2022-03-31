import { Op } from 'sequelize';

import { SanitizedPubData } from 'types';
import { CollectionPub, Pub } from 'server/models';

import sanitizePub from 'server/utils/queryHelpers/pubSanitize';
import buildPubOptions from 'server/utils/queryHelpers/pubOptions';

const getPubIdsForCollectionIds = async (collectionIds) => {
	if (collectionIds && collectionIds.length > 0) {
		const collectionPubs = await CollectionPub.findAll({
			where: {
				collectionId: { [Op.in]: collectionIds },
			},
		});
		return collectionPubs.map((collectionPub) => collectionPub.pubId);
	}
	return null;
};

const getPubIdQueryForPinnedPubs = (pinnedPubIds, scopedPubIds) => {
	if (scopedPubIds) {
		return { [Op.in]: pinnedPubIds.filter((id) => scopedPubIds.includes(id)) };
	}
	return { [Op.in]: pinnedPubIds };
};

const getPubIdQueryForNonPinnedPubs = async (collectionIds, scopedPubIds) => {
	const matchingPubIds = await getPubIdsForCollectionIds(collectionIds);
	if (matchingPubIds) {
		const filteredPubIds = scopedPubIds
			? matchingPubIds.filter((id) => scopedPubIds.includes(id))
			: matchingPubIds;
		return { [Op.in]: filteredPubIds };
	}
	if (scopedPubIds) {
		return { [Op.in]: scopedPubIds };
	}
	return {};
};

const getPubsForLayoutBlock = async (blockContent, initialData, scopedPubIds, excludePubIds) => {
	const {
		communityData: { id: communityId },
	} = initialData;
	const { limit, collectionIds = [], pubIds: pinnedPubIds = [] } = blockContent;

	const sharedOptions = {
		...buildPubOptions({
			isPreview: true,
			getMembers: true,
			getCollections: true,
		}),
		...(limit && { limit }),
		order: [['createdAt', 'DESC']],
	};

	const limitedPinnedPubIds = limit ? pinnedPubIds.slice(0, limit) : pinnedPubIds;
	const [pinnedPubs, otherPubs] = await Promise.all([
		Pub.findAll({
			where: {
				communityId,
				id: getPubIdQueryForPinnedPubs(limitedPinnedPubIds, scopedPubIds),
			},
			...sharedOptions,
		}),
		Pub.findAll({
			where: {
				communityId,
				id: {
					[Op.notIn]: [...limitedPinnedPubIds, ...excludePubIds],
					...(await getPubIdQueryForNonPinnedPubs(collectionIds, scopedPubIds)),
				},
			},
			...sharedOptions,
		}),
	]);

	const sanitizedPubs = [...pinnedPubs, ...otherPubs]
		.map((pub) => sanitizePub(pub.toJSON(), initialData))
		.filter((pub): pub is SanitizedPubData => !!pub);
	const limitedPubs = limit ? sanitizedPubs.slice(0, limit) : sanitizedPubs;
	return limitedPubs;
};

export const getPubsForLayout = async ({ blocks, forLayoutEditor, initialData, collectionId }) => {
	const scopedPubIds = collectionId && (await getPubIdsForCollectionIds([collectionId]));

	if (forLayoutEditor || scopedPubIds) {
		const collectionWhere = scopedPubIds && { id: { [Op.in]: scopedPubIds } };
		const pubs = await Pub.findAll({
			where: { communityId: initialData.communityData.id, ...collectionWhere },
			...buildPubOptions({ isPreview: true, getMembers: true, getCollections: true }),
		});
		return pubs.map((pub) => sanitizePub(pub.toJSON(), initialData)).filter((pub) => !!pub);
	}

	const pubBlocks = blocks.filter((block) => block.type === 'pubs');
	return pubBlocks.reduce(async (pubsPromise, block) => {
		const pubs = await pubsPromise;
		const nextPubs = await getPubsForLayoutBlock(
			block.content,
			initialData,
			scopedPubIds,
			pubs.map((p) => p.id),
		);
		const nextPubsToAdd = nextPubs.filter((nextPub) => !pubs.some((p) => p.id === nextPub.id));
		return [...pubs, ...nextPubsToAdd];
	}, Promise.resolve([]));
};
