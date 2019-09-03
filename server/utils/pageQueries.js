import Promise from 'bluebird';
// import { attributesPublicUser } from '.';
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
import { attributesPublicUser } from '.';
import { formatAndAuthenticatePub } from './formatPub';

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
							attributes: attributesPublicUser,
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
						{
							pub: pubData.toJSON(),
							loginData: initialData.loginData,
							communityAdminData: communityAdminData,
							req: { query: {}, params: {} },
						},
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
