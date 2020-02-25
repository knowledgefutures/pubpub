import {
	User,
	Collection,
	Pub,
	Community,
	CollectionAttribution,
	CollectionPub,
} from '../../models';
import { attributesPublicUser } from '..';
import buildPubOptions from './pubOptions';

export default async (initialData) => {
	const scopeData = initialData.scopeData;
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
					{
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
				],
			},
			{
				model: Pub,
				where: activeTargetType === 'pub' ? { id: activeTarget.id } : {},
				as: 'pubs',
				separate: true,
				...buildPubOptions({ isPreview: true, getCollections: true }),
			},
		],
	});
	if (!communityData) {
		throw new Error('Community Not Found');
	}
	return communityData.toJSON();
};
