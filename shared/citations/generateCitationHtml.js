import Cite from 'citation-js';

const collectionKindToCJSPart = (kind) =>
	({
		book: 'chapter',
		conference: 'paper-conference',
		issue: 'article-journal',
	}[kind] || 'article-journal');

const getCollectionLevelData = (primaryCollectionPub) => {
	if (!primaryCollectionPub) {
		return { type: 'article-journal' };
	}
	const {
		collection: { metadata = {}, title, kind },
	} = primaryCollectionPub;
	return {
		type: collectionKindToCJSPart(kind),
		'container-title': title,
		ISBN: metadata.isbn,
		ISSN: metadata.issn || metadata.printIssn || metadata.electronicIssn,
		edition: metadata.edition,
		volume: metadata.volume,
	};
};

export default (pubData, communityData) => {
	const isDraft = !pubData.versions.length;
	const pubIssuedDate = isDraft ? new Date() : new Date(pubData.updatedAt);
	const versionIssuedDate = isDraft ? new Date() : new Date(pubData.activeVersion.updatedAt);
	const communityHostname = communityData.domain || `${communityData.subdomain}.pubpub.org`;
	const pubLink = `https://${communityHostname}/pub/${pubData.slug}`;
	const primaryCollectionPub = pubData.collectionPubs.find((cp) => cp.isPrimary);
	const authorData = pubData.attributions
		.filter((attribution) => {
			return attribution.isAuthor;
		})
		.sort((foo, bar) => foo.order - bar.order)
		.map((attribution) => {
			return {
				given: attribution.user.firstName,
				family: attribution.user.lastName,
			};
		});
	const commonData = {
		title: pubData.title,
		'container-title': communityData.title,
		...(authorData.length ? { author: authorData } : {}),
		...getCollectionLevelData(primaryCollectionPub),
	};
	const pubCiteObject = new Cite({
		...commonData,
		id: pubData.id,
		DOI: pubData.doi,
		issued: [
			{
				'date-parts': [
					pubIssuedDate.getFullYear(),
					pubIssuedDate.getMonth() + 1,
					pubIssuedDate.getDate(),
				],
			},
		],
		note: pubLink,
		URL: pubLink,
	});
	const versionCiteObject = new Cite({
		...commonData,
		id: pubData.activeVersion.id || 'Draft',
		DOI:
			pubData.doi && pubData.activeVersion.id
				? `${pubData.doi}/${pubData.activeVersion.id.split('-')[0]}`
				: null,
		issued: [
			{
				'date-parts': [
					versionIssuedDate.getFullYear(),
					versionIssuedDate.getMonth() + 1,
					versionIssuedDate.getDate(),
				],
			},
		],
		note: pubData.activeVersion.id
			? `${pubLink}?version=${pubData.activeVersion.id}`
			: `${pubLink}/draft`,
		URL: pubData.activeVersion.id
			? `${pubLink}?version=${pubData.activeVersion.id}`
			: `${pubLink}/draft`,
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
		version: {
			apa: versionCiteObject
				.get({ format: 'string', type: 'html', style: 'citation-apa', lang: 'en-US' })
				.replace(/\n/gi, ''),
			harvard: versionCiteObject
				.get({ format: 'string', type: 'html', style: 'citation-harvard', lang: 'en-US' })
				.replace(/\n/gi, ''),
			vancouver: versionCiteObject
				.get({ format: 'string', type: 'html', style: 'citation-vancouver', lang: 'en-US' })
				.replace(/\n/gi, ''),
			bibtex: versionCiteObject.get({
				format: 'string',
				type: 'html',
				style: 'bibtex',
				lang: 'en-US',
			}),
		},
	};
};
