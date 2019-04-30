import Promise from 'bluebird';
import validator from 'validator';
import { attributesPublicUser } from '../utils';
import generateCitationHTML from 'shared/citations/generateCitationHtml';
import {
	User,
	Collection,
	CollectionAttribution,
	CollectionPub,
	Pub,
	Collaborator,
	Discussion,
	CommunityAdmin,
	Community,
	Version,
	PubManager,
	PubAttribution,
	VersionPermission,
	Page,
	DiscussionChannel,
	DiscussionChannelParticipant,
	Branch,
	BranchPermission,
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
					model: Version,
					required: false,
					as: 'versions',
					attributes: ['id', 'isPublic', 'isCommunityAdminShared', 'createdAt'],
				},
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
					attributes: [
						'createdAt',
						'id',
						'shortId',
						'title',
						'description',
						'order',
						'communityAdminPermissions',
						'publicPermissions',
						'viewHash',
						'editHash',
					],
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
