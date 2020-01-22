import { getPubPublishedDate, getPubUpdatedDate } from 'shared/pub/pubDates';
import dateFormat from 'dateformat';

import ensureUserForAttribution from 'shared/utils/ensureUserForAttribution';
import {
	Branch,
	Collection,
	CollectionPub,
	Community,
	Pub,
	PubAttribution,
	User,
} from '../../../server/models';

export const getPubMetadata = async (pubId) => {
	const pubData = await Pub.findOne({
		where: { id: pubId },
		include: [
			{
				model: CollectionPub,
				as: 'collectionPubs',
				include: [
					{
						model: Collection,
						as: 'collection',
					},
				],
			},
			{ model: Community, as: 'community' },
			{ model: Branch, as: 'branches' },
			{
				model: PubAttribution,
				as: 'attributions',
				include: [
					{
						model: User,
						as: 'user',
					},
				],
			},
		],
	});
	const publishedDate = getPubPublishedDate(pubData);
	const updatedDate = getPubUpdatedDate(pubData);
	const publishedDateString = publishedDate && dateFormat(publishedDate, 'mmm dd, yyyy');
	const updatedDateString = updatedDate && dateFormat(updatedDate, 'mmm dd, yyyy');
	return {
		title: pubData.title,
		doi: pubData.doi,
		publishedDateString: publishedDateString,
		updatedDateString: updatedDateString,
		communityTitle: pubData.community.title,
		accentColor: pubData.community.accentColorDark,
		primaryCollectionTitle: [pubData.collectionPubs.find((cp) => cp.isPrimary)]
			.filter((x) => x)
			.map((cp) => cp.collection.title)
			.pop(),
		attributions: pubData.attributions
			.concat()
			.sort((a, b) => a.order - b.order)
			.filter((attr) => attr.isAuthor)
			.map((attr) => ensureUserForAttribution(attr)),
	};
};
