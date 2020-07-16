import {
	Collection,
	Pub,
	Community,
	CollectionAttribution,
	CollectionPub,
	includeUserModel,
} from 'server/models';

import buildPubOptions from './pubOptions';

export default async (
	{ activeCommunity, activePub, activeCollection, activeTargetType },
	{ collectionOptions: { includeAttribution = true } = {} } = {},
) => {
	/* This is a bit of a hack for now. We likely will want
	more targeted and nuanced queries for each scope type. */
	const communityData = await Community.findOne({
		where: { id: activeCommunity.id },
		attributes: {
			exclude: ['createdAt', 'updatedAt'],
		},
		include: [
			{
				model: Collection,
				where:
					activeCollection && activeTargetType === 'collection'
						? { id: activeCollection.id }
						: {},
				as: 'collections',
				separate: true,
				include: [
					includeAttribution && {
						model: CollectionAttribution,
						as: 'attributions',
						include: [includeUserModel({ as: 'user' })],
					},
					{
						model: CollectionPub,
						as: 'collectionPubs',
						order: [['rank', 'ASC']],
					},
				].filter((x) => x),
			},
			{
				model: Pub,
				where: activePub && activeTargetType === 'pub' ? { id: activePub.id } : {},
				as: 'pubs',
				separate: true,
				...buildPubOptions({ isPreview: true, getMembers: true, getCollections: true }),
			},
		],
	});
	if (!communityData) {
		throw new Error('Community Not Found');
	}
	return communityData.toJSON();
};
