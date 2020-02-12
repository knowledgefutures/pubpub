import {
	User,
	Collection,
	CollectionPub,
	Pub,
	Community,
	CollectionAttribution,
	PubAttribution,
	Thread,
	// Merge,
	// Discussion,
	// Review,
} from '../models';
import { attributesPublicUser } from '.';

export const getOverviewData = (initialData) => {
	const scopeData = initialData.scopeData;
	const { activeTargetType, activeTarget } = scopeData.elements;
	/* This is a bit of a hack for now. We likely will want
	more targeted and nuanced queries for each scope type. */
	return Community.findOne({
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
				],
			},
			{
				model: Pub,
				where: activeTargetType === 'pub' ? { id: activeTarget.id } : {},
				as: 'pubs',
				separate: true,
				attributes: ['id', 'slug', 'title', 'avatar', 'doi', 'createdAt'],
				include: [
					{
						model: CollectionPub,
						as: 'collectionPubs',
						required: false,
						separate: true,
						attributes: ['id', 'collectionId', 'pubId', 'isPrimary', 'rank'],
					},
					{
						required: false,
						separate: true,
						model: Thread,
						as: 'threads',
						attributes: [
							'id',
							'title',
							'number',
							'forkId',
							'reviewId',
							'userId',
							'pubId',
							'createdAt',
						],
					},
					// {
					// 	required: false,
					// 	separate: true,
					// 	model: Discussion,
					// 	as: 'discussions',
					// 	attributes: ['id', 'title', 'threadNumber', 'userId', 'pubId', 'createdAt'],
					// },
					// {
					// 	required: false,
					// 	separate: true,
					// 	model: Review,
					// 	as: 'reviews',
					// 	attributes: ['id'],
					// },
					// {
					// 	required: false,
					// 	separate: true,
					// 	model: Merge,
					// 	as: 'merges',
					// 	attributes: ['id'],
					// },
					{
						model: PubAttribution,
						as: 'attributions',
						required: false,
						separate: true,
						include: [
							{
								model: User,
								as: 'user',
								required: false,
								attributes: attributesPublicUser,
							},
						],
					},
				],
			},
		],
	}).then((data) => {
		return data.toJSON();
	});
};
