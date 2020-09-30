import { Op } from 'sequelize';

import { CollectionPub, Pub } from 'server/models';
import { issueCreatePubToken } from 'server/pub/tokens';

import buildPubOptions from './pubOptions';
import sanitizePub from './pubSanitize';

const getPubIdWhereQueryForCollectionIds = async (collectionIds) => {
	if (collectionIds && collectionIds.length > 0) {
		const collectionPubs = await CollectionPub.findAll({
			where: {
				collectionId: {
					[Op.in]: collectionIds,
				},
			},
		});
		return {
			[Op.in]: collectionPubs.map((collectionPub) => collectionPub.pubId),
		};
	}
	return null;
};

const getPubsForLayoutBlock = async (blockContent, initialData) => {
	const {
		communityData: { id: communityId },
	} = initialData;
	const { limit, collectionIds, pubIds } = blockContent;

	const sharedOptions = {
		...buildPubOptions({
			isPreview: true,
			getMembers: true,
			getCollections: true,
		}),
		...(limit && { limit: limit }),
		order: [['createdAt', 'DESC']],
	};

	const pinnedPubIds = limit ? pubIds.slice(0, limit) : pubIds;
	const [pinnedPubs, otherPubs] = await Promise.all([
		Pub.findAll({
			where: { communityId: communityId, id: { [Op.in]: pinnedPubIds } },
			...sharedOptions,
		}),
		Pub.findAll({
			where: {
				communityId: communityId,
				id: {
					[Op.notIn]: pubIds,
					...(await getPubIdWhereQueryForCollectionIds(collectionIds)),
				},
			},
			...sharedOptions,
		}),
	]);

	const sanitizedPubs = [...pinnedPubs, ...otherPubs]
		.map((pub) => sanitizePub(pub.toJSON(), initialData))
		.filter((pub) => !!pub);

	if (limit) {
		return sanitizedPubs.slice(0, limit);
	}
	return sanitizedPubs;
};

export const getPubsForLayout = async (layoutBlocks, forLayoutEditor, initialData) => {
	if (forLayoutEditor) {
		const pubs = await Pub.findAll({
			where: { communityId: initialData.communityData.id },
			...buildPubOptions({ isPreview: true, getMembers: true, getCollections: true }),
		});
		return pubs.map((pub) => sanitizePub(pub.toJSON(), initialData)).filter((pub) => !!pub);
	}

	const pubsPerBlock = await Promise.all(
		(layoutBlocks || [])
			.filter((block) => block.type === 'pubs')
			.map((block) => getPubsForLayoutBlock(block.content, initialData)),
	);
	return pubsPerBlock.reduce(
		(acc, next) => [
			...acc,
			...next.filter((nextPub) => !acc.some((accPub) => accPub.id === nextPub.id)),
		],
		[],
	);
};

export const enrichLayoutWithPubTokens = (layoutBlocks, initialData) => {
	const { loginData, communityData } = initialData;
	const userId = loginData && loginData.id;
	if (layoutBlocks && userId) {
		return layoutBlocks.map((block) => {
			const { type, content } = block;
			if (type === 'banner') {
				const { buttonType, defaultCollectionIds } = content;
				if (buttonType === 'create-pub') {
					return {
						...block,
						content: {
							...content,
							createPubToken: issueCreatePubToken({
								userId: userId,
								communityId: communityData.id,
								createInCollectionIds: defaultCollectionIds,
							}),
						},
					};
				}
			}
			return block;
		});
	}
	return layoutBlocks;
};
