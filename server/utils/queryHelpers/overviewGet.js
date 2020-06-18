import {
	User,
	Collection,
	Pub,
	Community,
	CollectionAttribution,
	CollectionPub,
} from 'server/models';
import { attributesPublicUser } from 'server/utils/attributesPublicUser';

import buildPubOptions from './pubOptions';

export default async (
	{ scopeData },
	{ collectionOptions: { includeAttribution = true } = {} } = {},
) => {
	const { activeTargetType, activeTarget } = scopeData.elements;

	/* This is a bit of a hack for now. We likely will want
	more targeted and nuanced queries for each scope type. */
	const communityData = await Community.findOne({
		where: { id: scopeData.elements.activeCommunity.id },
		attributes: {
			exclude: ['createdAt', 'updatedAt'],
		},
		include: [
			{
				model: Collection,
				where: activeTargetType !== 'community' ? { id: activeTarget.id } : {},
				as: 'collections',
				separate: true,
				include: [
					includeAttribution && {
						model: CollectionAttribution,
						as: 'attributions',
						include: [
							{
								model: User,
								as: 'user',
								attributes: attributesPublicUser,
							},
						],
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
				where: activeTargetType === 'pub' ? { id: activeTarget.id } : {},
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
