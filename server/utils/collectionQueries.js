import Promise from 'bluebird';
import validator from 'validator';
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
} from '../models';

export const getCollectionAttributions = (collectionId) =>
	CollectionAttribution.findAll({
		where: { collectionId: collectionId },
		include: [
			{
				model: User,
				as: 'user',
				required: false,
				attributes: [
					'id',
					'firstName',
					'lastName',
					'fullName',
					'avatar',
					'slug',
					'initials',
					'title',
				],
			},
		],
	}).then((attributions) => {
		return attributions.map((attribution) => {
			if (attribution.user) {
				return attribution;
			}
			return {
				...attribution.toJSON(),
				user: {
					id: attribution.id,
					initials: attribution.name[0],
					fullName: attribution.name,
					firstName: attribution.name.split(' ')[0],
					lastName: attribution.name
						.split(' ')
						.slice(1, attribution.name.split(' ').length)
						.join(' '),
					avatar: attribution.avatar,
					title: attribution.title,
				},
			};
		});
	});

export const getCollectionPubsInCollection = (collectionId) =>
	CollectionPub.findAll({
		where: { collectionId: collectionId },
		order: [['rank', 'ASC']],
	});
