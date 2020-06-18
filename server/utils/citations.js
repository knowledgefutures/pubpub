/* eslint-disable import/prefer-default-export */
import Cite from 'citation-js';

import { getPubPublishedDate } from 'utils/pub/pubDates';
import { pubUrl } from 'utils/canonicalUrls';

const getDatePartsObject = (date) => ({
	'date-parts': [date.getFullYear(), date.getMonth() + 1, date.getDate()],
});

const collectionKindToCitationJSPart = (kind) =>
	({
		book: 'chapter',
		conference: 'paper-conference',
		issue: 'article-journal',
	}[kind] || 'article-journal');

const getCollectionLevelData = (primaryCollectionPub) => {
	if (!primaryCollectionPub) {
		return { type: 'article-journal' };
	}
	const { collection } = primaryCollectionPub;
	const { kind, title } = collection;
	const metadata = collection.metadata || {};
	const useCollectionTitle = collection.kind !== 'issue';
	return {
		type: collectionKindToCitationJSPart(kind),
		...(useCollectionTitle && { 'container-title': title }),
		ISBN: metadata.isbn,
		ISSN: metadata.issn || metadata.printIssn || metadata.electronicIssn,
		edition: metadata.edition,
		volume: metadata.volume,
		issue: metadata.issue,
	};
};

export const generateCitationHTML = async (pubData, communityData) => {
	// TODO: We need to set the updated times properly, which are likely stored in firebase.
	const pubIssuedDate = getPubPublishedDate(pubData);
	const pubLink = pubUrl(communityData, pubData);
	const primaryCollectionPub = pubData.collectionPubs.find((cp) => cp.isPrimary);
	const authorData = pubData.attributions
		.filter((attribution) => {
			return attribution.isAuthor;
		})
		.sort((foo, bar) => {
			if (foo.order < bar.order) {
				return -1;
			}
			if (foo.order > bar.order) {
				return 1;
			}
			return 0;
		})
		.map((attribution) => {
			return {
				given: attribution.user.firstName,
				family: attribution.user.lastName,
			};
		});
	const authorsEntry = authorData.length ? { author: authorData } : {};
	const commonData = {
		type: 'article-journal',
		title: pubData.title,
		...authorsEntry,
		'container-title': communityData.title,
		...getCollectionLevelData(primaryCollectionPub),
	};
	const pubCiteObject = await Cite.async({
		...commonData,
		DOI: pubData.doi,
		ISSN: pubData.doi ? communityData.issn : null,
		issued: pubIssuedDate && [getDatePartsObject(pubIssuedDate)],
		note: pubLink,
		URL: pubLink,
	});

	return {
		pub: {
			apa: pubCiteObject
				.get({ format: 'string', type: 'html', style: 'citation-apa', lang: 'en-US' })
				.replace(/\n/gi, ''),
			harvard: pubCiteObject
				.get({ format: 'string', type: 'html', style: 'citation-harvard', lang: 'en-US' })
				.replace(/\n/gi, ''),
			vancouver: pubCiteObject
				.get({ format: 'string', type: 'html', style: 'citation-vancouver', lang: 'en-US' })
				.replace(/\n/gi, ''),
			bibtex: pubCiteObject.get({
				format: 'string',
				type: 'html',
				style: 'bibtex',
				lang: 'en-US',
			}),
		},
	};
};
