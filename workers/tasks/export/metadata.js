import dateFormat from 'dateformat';

import ensureUserForAttribution from 'utils/ensureUserForAttribution';
import { getPubPublishedDate, getPubUpdatedDate } from 'utils/pub/pubDates';
import {
	Branch,
	Collection,
	CollectionPub,
	Community,
	Pub,
	PubAttribution,
	Release,
	includeUserModel,
} from 'server/models';

const getPrimaryCollectionMetadata = (collectionPubs) => {
	const primaryCollection = collectionPubs.find((cp) => cp.isPrimary);
	if (primaryCollection && primaryCollection.collection) {
		const { metadata, title } = primaryCollection.collection;
		return { primaryCollectionMetadata: metadata, primaryCollectionTitle: title };
	}
	return null;
};

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
				include: [includeUserModel({ as: 'user' })],
			},
			{
				model: Release,
				as: 'releases',
			},
		],
	});
	const publishedDate = getPubPublishedDate(pubData);
	const updatedDate = getPubUpdatedDate({ pub: pubData });
	const publishedDateString = publishedDate && dateFormat(publishedDate, 'mmm dd, yyyy');
	const updatedDateString = updatedDate && dateFormat(updatedDate, 'mmm dd, yyyy');
	return {
		title: pubData.title,
		doi: pubData.doi,
		licenseSlug: pubData.licenseSlug,
		publishedDateString: publishedDateString,
		updatedDateString: updatedDateString,
		communityTitle: pubData.community.title,
		accentColor: pubData.community.accentColorDark,
		attributions: pubData.attributions
			.concat()
			.sort((a, b) => a.order - b.order)
			.filter((attr) => attr.isAuthor)
			.map((attr) => ensureUserForAttribution(attr)),
		citationStyle: pubData.citationStyle,
		citationInlineStyle: pubData.citationInlineStyle,
		...getPrimaryCollectionMetadata(pubData.collectionPubs),
	};
};
