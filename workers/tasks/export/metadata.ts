import type * as types from 'types';

import type { PubMetadata } from './types';

import dateFormat from 'dateformat';

import { fetchFacetsForScope } from 'server/facets';
import {
	Collection,
	CollectionAttribution,
	CollectionPub,
	Community,
	includeUserModel,
	Pub,
	PubAttribution,
	Release,
} from 'server/models';
import { expect } from 'utils/assert';
import { getCorrectHostname } from 'utils/caching/getCorrectHostname';
import { renderJournalCitation } from 'utils/citations';
import { getPrimaryCollection } from 'utils/collections/primary';
import { getAllPubContributors } from 'utils/contributors';
import { renderLicenseForPub } from 'utils/licenses';
import { getPubPublishedDate, getPubUpdatedDate } from 'utils/pub/pubDates';
import { getUrlForPub } from 'utils/pubEdge';

const getPrimaryCollectionMetadata = (collectionPubs: types.CollectionPub[] | CollectionPub[]) => {
	const primaryCollection = getPrimaryCollection(collectionPubs);
	if (primaryCollection) {
		const { metadata, title, kind } = primaryCollection;
		return {
			primaryCollectionMetadata: metadata,
			primaryCollectionTitle: title,
			primaryCollectionKind: kind,
		};
	}
	return null;
};

export const getPubMetadata = async (pubId: string): Promise<PubMetadata> => {
	const pubDataPromise = Pub.findOne({
		where: { id: pubId },
		include: [
			{
				model: CollectionPub,
				as: 'collectionPubs',
				include: [
					{
						model: Collection,
						as: 'collection',
						include: [
							{
								model: CollectionAttribution,
								as: 'attributions',
								include: [includeUserModel({ as: 'user' })],
							},
						],
					},
				],
			},
			{ model: Community, as: 'community' },
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

	const facetPromise = fetchFacetsForScope({ pubId });

	const result = await Promise.all([pubDataPromise, facetPromise]);

	const facets = result[1];

	const pubData = expect(result[0]) as types.DefinitelyHas<
		Pub,
		'community' | 'attributions' | 'releases'
	> & {
		collectionPubs: types.DefinitelyHas<CollectionPub, 'collection'>[];
	};

	const pubUrl = getUrlForPub(pubData, pubData.community);
	const publishedDate = getPubPublishedDate(pubData);
	const license = renderLicenseForPub({
		pub: pubData,
		community: pubData.community,
		collectionPubs: pubData.collectionPubs,
		license: facets.License.value,
	});
	const updatedDate = getPubUpdatedDate({ pub: pubData });
	const publishedDateString = publishedDate && dateFormat(publishedDate, 'mmm dd, yyyy');
	const updatedDateString = updatedDate && dateFormat(updatedDate, 'mmm dd, yyyy');
	const primaryCollection = getPrimaryCollection(pubData.collectionPubs);
	const attributions = getAllPubContributors(pubData, 'contributors', false, true);

	const hostname = getCorrectHostname(pubData.community.subdomain, pubData.community.domain);
	return {
		title: pubData.title,
		slug: pubData.slug,
		pubUrl,
		doi: pubData.doi,
		publishedDateString,
		updatedDateString,
		communityTitle: renderJournalCitation(
			primaryCollection?.kind,
			pubData.community.citeAs,
			pubData.community.title,
		),
		accentColor: pubData.community.accentColorDark,
		attributions,
		citationStyle: facets.CitationStyle.value.citationStyle,
		citationInlineStyle: facets.CitationStyle.value.inlineCitationStyle,
		nodeLabels: facets.NodeLabels.value,
		publisher: pubData.community.publishAs,
		...getPrimaryCollectionMetadata(pubData.collectionPubs),
		license,
		hostname,
	};
};
