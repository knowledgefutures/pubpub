import Promise from 'bluebird';
import { attributesPublicUser } from '.';
import {
	User,
	Collection,
	CollectionPub,
	Pub,
	CommunityAdmin,
	PubManager,
	PubAttribution,
	Page,
	Branch,
	BranchPermission,
	Review,
} from '../models';
import { formatAndAuthenticatePub } from './pubQueries';

export const findPage = (pageId, useIncludes, initialData) => {
	const pageQuery = Page.findOne({
		where: { id: pageId },
	});
	const communityAdminQuery = CommunityAdmin.findOne({
		where: {
			userId: initialData.loginData.id,
			communityId: initialData.communityData.id,
		},
	});
	const pubsQuery =
		useIncludes &&
		Pub.findAll({
			where: { communityId: initialData.communityData.id },
			include: [
				{
					model: PubManager,
					as: 'managers',
					separate: true,
				},
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
							attributes: ['id', 'fullName', 'avatar', 'slug', 'initials', 'title'],
						},
					],
				},
				{
					// separate: true,
					model: Branch,
					as: 'branches',
					required: true,
					include: [
						{
							model: BranchPermission,
							as: 'permissions',
							separate: true,
							required: false,
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
					model: Review,
					as: 'reviews',
					separate: true,
				},
				{
					model: CollectionPub,
					as: 'collectionPubs',
					required: false,
					separate: true,
					include: [
						{
							model: Collection,
							as: 'collection',
						},
					],
				},
			],
		});
	return Promise.all([pageQuery, communityAdminQuery, pubsQuery]).then(
		([pageData, communityAdminData, pubsData]) => {
			const formattedPubsData = pubsData
				.map((pubData) => {
					return formatAndAuthenticatePub(
						pubData.toJSON(),
						initialData.loginData,
						communityAdminData,
						{ query: {}, params: {} },
						false,
					);
				})
				.filter((formattedPub) => {
					return formattedPub;
				});
			return {
				...pageData.toJSON(),
				pubs: formattedPubsData,
			};
		},
	);
};
