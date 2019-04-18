/* eslint-disable import/prefer-default-export */
import Cite from 'citation-js';

export const generateCitationHTML = (pubData, communityData) => {
	// if (!pubData.versions.length) { return null; }
	// const isDraft = !pubData.versions.length;
	const isDraft = true;

	// TODO: We need to set the updated times properly, which are likely stored in firebase.
	const pubIssuedDate = isDraft ? new Date() : new Date(pubData.updatedAt);
	const versionIssuedDate = isDraft ? new Date() : new Date(pubData.activeVersion.updatedAt);
	const communityHostname = communityData.domain || `${communityData.subdomain}.pubpub.org`;
	const pubLink = `https://${communityHostname}/pub/${pubData.slug}`;
	// const authorData = pubData.collaborators.filter((item)=> {
	// 	return item.Collaborator.isAuthor;
	// }).sort((foo, bar)=> {
	// 	if (foo.Collaborator.order < bar.Collaborator.order) { return -1; }
	// 	if (foo.Collaborator.order > bar.Collaborator.order) { return 1; }
	// 	return 0;
	// }).map((author)=> {
	// 	return {
	// 		given: author.firstName,
	// 		family: author.lastName,
	// 	};
	// });
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
	};
	const pubCiteObject = new Cite({
		...commonData,
		id: pubData.id,
		DOI: pubData.doi,
		// ISSN: pubData.doi ? (communityData.issn || '2471–2388') : null,
		ISSN: pubData.doi ? communityData.issn : null,
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
		id: pubData.activeVersion ? pubData.activeVersion.id : 'Draft',
		DOI:
			pubData.doi && pubData.activeVersion.id
				? `${pubData.doi}/${pubData.activeVersion.id.split('-')[0]}`
				: null,
		// ISSN: pubData.doi ? (communityData.issn || '2471–2388') : null,
		ISSN: pubData.doi ? communityData.issn : null,
		issued: [
			{
				'date-parts': [
					versionIssuedDate.getFullYear(),
					versionIssuedDate.getMonth() + 1,
					versionIssuedDate.getDate(),
				],
			},
		],
		note: pubData.activeVersion
			? `${pubLink}?version=${pubData.activeVersion.id}`
			: `${pubLink}/draft`,
		URL: pubData.activeVersion
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
