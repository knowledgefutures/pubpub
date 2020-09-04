import { Op } from 'sequelize';

import { CollectionPub, Pub, Page } from 'server/models';
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

const getPubsForPageBlock = async (blockContent, initialData) => {
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
	};

	const [pubsInPubIds, otherPubs] = await Promise.all([
		Pub.findAll({
			where: { communityId: communityId, id: { [Op.in]: pubIds } },
			...(limit && { limit: limit }),
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
			order: [['createdAt', 'DESC']],
			...sharedOptions,
		}),
	]);

	const sanitizedPubs = [...pubsInPubIds, ...otherPubs]
		.map((pub) => sanitizePub(pub.toJSON(), initialData))
		.filter((pub) => !!pub);

	if (limit) {
		return sanitizedPubs.slice(0, limit);
	}
	return sanitizedPubs;
};

const getPubsForPageLayout = async (layout, initialData) => {
	const {
		communityData: { subdomain: communitySubdomain },
	} = initialData;

	// TODO(ian): Remove this once we're sure that the less aggressive query works everywhere.
	if (communitySubdomain !== 'baas') {
		const pubs = await Pub.findAll({
			where: { communityId: initialData.communityData.id },
			...buildPubOptions({ isPreview: true, getMembers: true, getCollections: true }),
		});
		return pubs.map((pub) => sanitizePub(pub.toJSON(), initialData)).filter((pub) => !!pub);
	}

	const pubsPerBlock = await Promise.all(
		(layout || [])
			.filter((block) => block.type === 'pubs')
			.map((block) => getPubsForPageBlock(block.content, initialData)),
	);
	return pubsPerBlock.reduce((acc, next) => [...acc, ...next], []);
};

const enrichLayoutWithPubTokens = (layout, initialData) => {
	const { loginData, communityData } = initialData;
	const userId = loginData && loginData.id;
	if (layout && userId) {
		return layout.map((block) => {
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
	return layout;
};

export default async (idOrSlugObject, initialData) => {
	const pageData = await Page.findOne({
		where: {
			...idOrSlugObject,
			communityId: initialData.communityData.id,
		},
	});

	const pubsData = await getPubsForPageLayout(pageData.layout, initialData);

	return {
		...pageData.toJSON(),
		layout: enrichLayoutWithPubTokens(pageData.layout, initialData),
		pubs: pubsData,
	};
};
