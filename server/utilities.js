import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { resolve } from 'path';
import { Readable } from 'stream';
import queryString from 'query-string';
import Cite from 'citation-js';
import builder from 'xmlbuilder';
import request from 'request-promise';
import amqplib from 'amqplib';
import { remove as removeDiacritics } from 'diacritics';
import { Community, User, Pub, Version, PubAttribution, Tag, Page } from './models';

const isPubPubProduction = !!process.env.PUBPUB_PRODUCTION;
const doiSubmissionUrl = process.env.DOI_SUBMISSION_URL;
const doiLoginId = process.env.DOI_LOGIN_ID;
const doiLoginPassword = process.env.DOI_LOGIN_PASSWORD;

export const slugifyString = (input)=> {
	if (typeof input !== 'string') {
		console.error('input is not a valid string');
		return '';
	}

	return removeDiacritics(input).replace(/ /g, '-').replace(/[^a-zA-Z0-9-]/gi, '').toLowerCase();
};

export const hostIsValid = (req, access)=> {
	const isBasePubPub = req.hostname === 'www.pubpub.org';
	if (!isBasePubPub && access !== 'community') { return false; }
	if (isBasePubPub && access !== 'pubpub') { return false; }
	return true;
};

export const renderToNodeStream = (res, reactElement)=> {
	res.setHeader('content-type', 'text/html');
	return ReactDOMServer.renderToNodeStream(reactElement)
	.pipe(res);
};

export const getInitialData = (req)=> {
	const hostname = req.hostname;
	const whereQuery = hostname.indexOf('.pubpub.org') > -1
		? { subdomain: hostname.replace('.pubpub.org', '') }
		: { domain: hostname };

	/* Gather user data */
	const user = req.user || {};
	const loginData = {
		id: user.id,
		initials: user.initials,
		slug: user.slug,
		fullName: user.fullName,
		avatar: user.avatar,
	};

	/* Gather location data */
	const locationData = {
		hostname: req.hostname,
		path: req.path,
		params: req.params,
		query: req.query,
		queryString: req.query
			? `?${queryString.stringify(req.query)}`
			: '',
		isBasePubPub: hostname === 'www.pubpub.org',
		isPubPubProduction: isPubPubProduction,
	};

	/* If basePubPub - return fixed data */
	if (locationData.isBasePubPub) {
		return new Promise((resolvePromise)=> {
			resolvePromise({
				communityData: {
					title: 'PubPub',
					description: 'Collaborative Community Publishing',
					favicon: `https://${locationData.hostname}/favicon.png`,
					avatar: `https://${locationData.hostname}/static/logo.png`,
					smallHeaderLogo: locationData.path === '/'
						? '/static/logoWhite.svg'
						: '/static/logoBlack.svg',
					accentColor: '#112233',
					accentTextColor: '#FFFFFF',
					accentActionColor: 'rgba(17, 34, 51, 0.6)',
					accentHoverColor: 'rgba(17, 34, 51, 0.8)',
					accentMinimalColor: 'rgba(17, 34, 51, 0.2)',
				},
				loginData: loginData,
				locationData: locationData,
			});
		});
	}

	/* If we have a community to find, search, and then return */
	return Community.findOne({
		where: whereQuery,
		attributes: {
			exclude: ['createdAt', 'updatedAt']
		},
		include: [
			// {
			// 	model: Collection,
			// 	as: 'collections',
			// 	attributes: {
			// 		exclude: ['createdAt', 'updatedAt', 'communityId']
			// 	},
			// },
			{
				model: Page,
				as: 'pages',
				attributes: {
					exclude: ['createdAt', 'updatedAt', 'communityId']
				},
			},
			{
				model: User,
				as: 'admins',
				through: { attributes: [] },
				attributes: ['id', 'slug', 'fullName', 'initials', 'avatar'],
			},
			{
				model: Tag,
				as: 'tags',
				separate: true,
				// include: [{ model: Page, as: 'page', required: false, attributes: ['id', 'title', 'slug'] }]
			}
		],
	})
	.then((communityResult)=> {
		if (!communityResult) { throw new Error('Community Not Found'); }

		const communityData = communityResult.toJSON();

		loginData.isAdmin = communityData.admins.reduce((prev, curr)=> {
			if (curr.id === user.id) { return true; }
			return prev;
		}, false);

		const availablePages = {};
		communityData.pages = communityData.pages.filter((item)=> {
			if (!loginData.isAdmin && !item.isPublic && locationData.query.access !== item.viewHash) {
				return false;
			}

			availablePages[item.id] = {
				id: item.id,
				title: item.title,
				slug: item.slug,
			};
			return true;
		});

		communityData.tags = communityData.tags.filter((item)=> {
			return loginData.isAdmin || item.isPublic;
		});

		communityData.tags = communityData.tags.map((tag)=> {
			if (!tag.pageId) { return tag; }
			return {
				...tag,
				page: availablePages[tag.pageId]
			};
		});

		const outputData = {
			communityData: communityData,
			loginData: loginData,
			locationData: locationData,
		};

		return outputData;
	});
};

export const generateMetaComponents = ({ initialData, title, description, image, attributions, doi, publishedAt, unlisted })=> {
	const siteName = initialData.communityData.title;
	const url = `https://${initialData.locationData.hostname}${initialData.locationData.path}`;
	const favicon = initialData.communityData.favicon;
	const avatar = image || initialData.communityData.avatar;
	let outputComponents = [];

	if (title) {
		outputComponents = [
			...outputComponents,
			<title key="t1">{title}</title>,
			<meta key="t2" property="og:title" content={title} />,
			<meta key="t3" name="twitter:title" content={title} />,
			<meta key="t4" name="twitter:image:alt" content={title} />,
			<meta key="t5" name="citation_title" content={title} />,
			<meta key="t6" name="dc.title" content={title} />,
		];
	}

	if (siteName) {
		outputComponents = [
			...outputComponents,
			<meta key="sn1" property="og:site_name" content={siteName} />,
			<meta key="sn2" property="citation_journal_title" content={siteName} />,
		];
	}

	if (url) {
		outputComponents = [
			...outputComponents,
			<meta key="u1" property="og:url" content={url} />,
			<meta key="u2" property="og:type" content={url.indexOf('/pub/') > -1 ? 'article' : 'website'} />,
		];
	}

	if (description) {
		outputComponents = [
			...outputComponents,
			<meta key="d1" name="description" content={description} />,
			<meta key="d2" property="og:description" content={description} />,
			<meta key="d3" name="twitter:description" content={description} />,
		];
	}

	if (avatar) {
		outputComponents = [
			...outputComponents,
			<meta key="i1" property="og:image" content={avatar} />,
			<meta key="i2" property="og:image:url" content={avatar} />,
			<meta key="i3" property="og:image:width" content="500" />,
			<meta key="i4" name="twitter:image" content={avatar} />,
		];
	}

	if (favicon) {
		outputComponents = [
			...outputComponents,
			<link key="f1" rel="icon" type="image/png" sizes="256x256" href={favicon} />,
		];
	}

	if (attributions) {
		const authors = attributions.sort((foo, bar)=> {
			if (foo.order < bar.order) { return -1; }
			if (foo.order > bar.order) { return 1; }
			if (foo.createdAt < bar.createdAt) { return 1; }
			if (foo.createdAt > bar.createdAt) { return -1; }
			return 0;
		}).filter((item)=> {
			return item.isAuthor;
		});
		const citationAuthorTags = authors.map((author)=> {
			return <meta key={`author-cite-${author.id}`} name="citation_author" content={author.user.fullName} />;
		});
		const dcAuthorTags = authors.map((author)=> {
			return <meta key={`author-dc-${author.id}`} name="dc.creator" content={author.user.fullName} />;
		});
		outputComponents = [
			...outputComponents,
			citationAuthorTags,
			dcAuthorTags,
		];
	}

	if (publishedAt) {
		const googleScholarPublishedAt = `${publishedAt.getFullYear()}/${publishedAt.getMonth() + 1}/${publishedAt.getDate()}`;
		outputComponents = [
			...outputComponents,
			<meta key="pa1" property="article:published_time" content={publishedAt} />,
			<meta key="pa2" property="citation_publication_date" content={googleScholarPublishedAt} />,
			<meta key="pub1" property="citation_publisher" content="PubPub" />,
			<meta key="pub2" property="dc.publisher" content="PubPub" />,
		];
	}

	if (doi) {
		outputComponents = [
			...outputComponents,
			<meta key="doi1" property="citation_doi" content={`doi:${doi}`} />,
			<meta key="doi2" property="dc.identifier" content={`doi:${doi}`} />,
			<meta key="doi3" property="prism.doi" content={`doi:${doi}`} />,
		];
	}

	if (unlisted) {
		outputComponents = [
			...outputComponents,
			<meta key="un1" name="robots" content="noindex,nofollow" />
		];
	}

	outputComponents = [
		...outputComponents,
		<meta key="misc1" property="fb:app_id" content="924988584221879" />,
		<meta key="misc2" name="twitter:card" content="summary" />,
		<meta key="misc3" name="twitter:site" content="@pubpub" />,
	];

	return outputComponents;
};

export const handleErrors = (req, res, next)=> {
	return (err) => {
		if (err.message === 'Community Not Found') {
			return res.status(404).sendFile(resolve(__dirname, './errorPages/communityNotFound.html'));
		}
		if (err.message.indexOf('DraftRedirect:') === 0) {
			const slug = err.message.split(':')[1];
			return res.redirect(`/pub/${slug}/draft`);
		}
		if (err.message === 'Page Not Found' ||
			err.message === 'Pub Not Found' ||
			err.message === 'User Not Admin' ||
			err.message === 'User Not Found'
		) {
			return next();
		}
		console.error('Err', err);
		return res.status(500).json('Error');
	};
};

export function generateHash(length) {
	const tokenLength = length || 32;
	const possible = 'abcdefghijklmnopqrstuvwxyz0123456789';

	let hash = '';
	for (let index = 0; index < tokenLength; index += 1) {
		hash += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return hash;
}

export function generateCitationHTML(pubData, communityData) {
	// if (!pubData.versions.length) { return null; }
	const isDraft = !pubData.versions.length;

	const pubIssuedDate = isDraft
		? new Date()
		: new Date(pubData.updatedAt);
	const versionIssuedDate = isDraft
		? new Date()
		: new Date(pubData.activeVersion.updatedAt);
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
	const authorData = pubData.attributions.filter((attribution)=> {
		return attribution.isAuthor;
	}).sort((foo, bar)=> {
		if (foo.order < bar.order) { return -1; }
		if (foo.order > bar.order) { return 1; }
		return 0;
	}).map((attribution)=> {
		return {
			given: attribution.user.firstName,
			family: attribution.user.lastName,
		};
	});
	const authorsEntry = authorData.length
		? { author: authorData }
		: {};
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
		issued: [{
			'date-parts': [pubIssuedDate.getFullYear(), pubIssuedDate.getMonth() + 1, pubIssuedDate.getDate()]
		}],
		note: pubLink,
		URL: pubLink,
	});
	const versionCiteObject = new Cite({
		...commonData,
		id: pubData.activeVersion.id || 'Draft',
		DOI: pubData.doi && pubData.activeVersion.id ? `${pubData.doi}/${pubData.activeVersion.id.split('-')[0]}` : null,
		// ISSN: pubData.doi ? (communityData.issn || '2471–2388') : null,
		ISSN: pubData.doi ? communityData.issn : null,
		issued: [{
			'date-parts': [versionIssuedDate.getFullYear(), versionIssuedDate.getMonth() + 1, versionIssuedDate.getDate()]
		}],
		note: pubData.activeVersion.id ? `${pubLink}?version=${pubData.activeVersion.id}` : `${pubLink}/draft`,
		URL: pubData.activeVersion.id ? `${pubLink}?version=${pubData.activeVersion.id}` : `${pubLink}/draft`,
	});

	return {
		pub: {
			apa: pubCiteObject.get({ format: 'string', type: 'html', style: 'citation-apa', lang: 'en-US' }).replace(/\n/gi, ''),
			harvard: pubCiteObject.get({ format: 'string', type: 'html', style: 'citation-harvard', lang: 'en-US' }).replace(/\n/gi, ''),
			vancouver: pubCiteObject.get({ format: 'string', type: 'html', style: 'citation-vancouver', lang: 'en-US' }).replace(/\n/gi, ''),
			bibtex: pubCiteObject.get({ format: 'string', type: 'html', style: 'bibtex', lang: 'en-US' }),
		},
		version: {
			apa: versionCiteObject.get({ format: 'string', type: 'html', style: 'citation-apa', lang: 'en-US' }).replace(/\n/gi, ''),
			harvard: versionCiteObject.get({ format: 'string', type: 'html', style: 'citation-harvard', lang: 'en-US' }).replace(/\n/gi, ''),
			vancouver: versionCiteObject.get({ format: 'string', type: 'html', style: 'citation-vancouver', lang: 'en-US' }).replace(/\n/gi, ''),
			bibtex: versionCiteObject.get({ format: 'string', type: 'html', style: 'bibtex', lang: 'en-US' }),
		}
	};
}

export function submitDoiData(pubId, communityId, isNew) {
	const findPub = Pub.findOne({
		where: { id: pubId, communityId: communityId },
		include: [
			{ model: Version, as: 'versions', where: { isPublic: true } },
			// { model: User, as: 'collaborators' },
			// { model: Collaborator, as: 'emptyCollaborators', where: { userId: null }, required: false }
			{
				model: PubAttribution,
				as: 'attributions',
				required: false,
				include: [{ model: User, as: 'user', required: false, attributes: ['id', 'firstName', 'lastName', 'fullName', 'avatar', 'slug', 'initials', 'title'] }],
			},
		]
	});
	const findCommunity = Community.findOne({
		where: { id: communityId },
		attributes: ['id', 'title', 'issn', 'domain', 'subdomain']
	});

	return Promise.all([findPub, findCommunity])
	.then(([pubData, communityData])=> {
		// TODO: DOI options need a refactor now that versions can be public.
		if (!pubData) { return [null]; }
		if (!pubData.doi && !isNew) { return [null]; }

		const pubDataJson = pubData.toJSON();
		const timestamp = new Date().getTime();
		const sortedVersions = pubData.versions.sort((foo, bar)=> {
			if (foo.createdAt < bar.createdAt) { return -1; }
			if (foo.createdAt > bar.createdAt) { return 1; }
			return 0;
		});
		const publishedDate = new Date(sortedVersions[0].createdAt);
		const doi = pubData.doi || `10.21428/${pubData.id.split('-')[0]}`;
		// const issn = communityData.issn ? communityData.issn.replace('-', '') : '24712388';
		const issn = communityData.issn ? communityData.issn.replace('-', '') : null;
		const issnObject = issn
			? {
				issn: {
					'@media_type': 'electronic',
					'#text': issn,
				}
			}
			: null;
		const communityHostname = communityData.domain || `${communityData.subdomain}.pubpub.org`;
		const communityLink = `https://${communityHostname}`;
		const pubLink = `https://${communityHostname}/pub/${pubData.slug}`;
		// const collaborators = [
		// 	...pubDataJson.collaborators,
		// 	...pubDataJson.emptyCollaborators.map((item)=> {
		// 		return {
		// 			id: item.id,
		// 			firstName: item.name.split(' ')[0],
		// 			lastName: item.name.split(' ').slice(1, item.name.split(' ').length).join(' '),
		// 			Collaborator: {
		// 				id: item.id,
		// 				isAuthor: item.isAuthor,
		// 				isContributor: item.isContributor,
		// 				title: item.title,
		// 				roles: item.roles,
		// 				permissions: item.permissions,
		// 				order: item.order,
		// 				createdAt: item.createdAt,
		// 			}
		// 		};
		// 	})
		const collaborators = pubDataJson.attributions.map((attribution)=> {
			if (attribution.user) { return attribution; }
			return {
				...attribution,
				user: {
					id: attribution.id,
					initials: attribution.name[0],
					fullName: attribution.name,
					firstName: attribution.name.split(' ')[0],
					lastName: attribution.name.split(' ').slice(1, attribution.name.split(' ').length).join(' '),
					avatar: attribution.avatar,
					title: attribution.title
				}
			};
		})
		.sort((foo, bar)=> {
			if (foo.order < bar.order) { return -1; }
			if (foo.order > bar.order) { return 1; }
			return 0;
		});

		const xmlObject = builder.create({
			doi_batch: {
				'@xmlns': 'http://www.crossref.org/schema/4.4.1',
				'@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
				'@version': '4.4.1',
				'@xsi:schemaLocation': 'http://www.crossref.org/schema/4.4.1 http://www.crossref.org/schema/deposit/crossref4.4.1.xsd',
				head: {
					doi_batch_id: `${pubData.id}_${timestamp}`,
					timestamp: timestamp,
					depositor: {
						depositor_name: 'PubPub',
						email_address: 'pubpub@media.mit.edu',
					},
					registrant: 'PubPub',
				},
				body: {
					journal: {
						journal_metadata: {
							'@language': 'en',
							full_title: communityData.title,
							abbrev_title: communityData.title,
							...issnObject,
							doi_data: {
								doi: `10.21428/${communityData.id.split('-')[0]}`,
								timestamp: timestamp,
								resource: communityLink,
							},
						},
						journal_article: {
							'@publication_type': 'full_text',
							titles: {
								title: pubData.title,
							},
							contributors: {
								person_name: collaborators.map((collaborator, collaboratorIndex)=>{
									const personNameOutput = {
										'@sequence': collaboratorIndex === 0 ? 'first' : 'additional',
										'@contributor_role': collaborator.isAuthor ? 'author' : 'reader',
										given_name: collaborator.user.lastName ? collaborator.user.firstName : '',
										surname: collaborator.user.lastName ? collaborator.user.lastName : collaborator.user.firstName,
									};
									if (!personNameOutput.given_name) { delete personNameOutput.given_name; }
									return personNameOutput;
								})
							},
							publication_date: {
								'@media_type': 'online',
								month: `0${publishedDate.getMonth() + 1}`.slice(-2),
								day: publishedDate.getDate(),
								year: publishedDate.getFullYear(),
							},
							doi_data: {
								doi: doi,
								timestamp: timestamp,
								resource: pubLink,
							},
							component_list: {
								component: sortedVersions.map((version)=> {
									const versionDate = new Date(version.createdAt);
									return {
										'@parent_relation': 'isPartOf',
										publication_date: {
											'@media_type': 'online',
											month: `0${versionDate.getMonth() + 1}`.slice(-2),
											day: versionDate.getDate(),
											year: versionDate.getFullYear(),
										},
										doi_data: {
											doi: `${doi}/${version.id.split('-')[0]}`,
											timestamp: timestamp,
											resource: `${pubLink}?version=${version.id}`,
										},
									};
								})
							}
						}
					}
				}
			}
		}, { headless: true }).end({ pretty: true });

		const readStream = new Readable();
		readStream._read = function noop() {};
		readStream.push(xmlObject);
		readStream.push(null);
		readStream.path = `/${timestamp}.xml`;
		const submitToCrossref = request({
			method: 'POST',
			url: doiSubmissionUrl,
			formData: {
				login_id: doiLoginId,
				login_passwd: doiLoginPassword,
				fname: readStream,
			},
			headers: {
				'content-type': 'multipart/form-data'
			},
		});
		return Promise.all([doi, submitToCrossref]);
	})
	.then(([doi])=> {
		if (!doi) { return [null]; }
		const updatePub = Pub.update({ doi: doi }, {
			where: { id: pubId, communityId: communityId }
		});
		return Promise.all([doi, updatePub]);
	})
	.then(([doi])=> {
		return doi;
	});
}


/* Worker Queue Tasks */
const queueName = 'pubpubTaskQueue';
let openChannel;
amqplib.connect(process.env.CLOUDAMQP_URL).then((conn)=> {
	return conn.createConfirmChannel().then((channel)=> {
		return channel.assertQueue(queueName, { durable: true })
		.then(()=> {
			openChannel = channel;
		});
	});
});

export function addWorkerTask(message) {
	openChannel.sendToQueue(queueName, Buffer.from(message), { deliveryMode: true });
	return openChannel.waitForConfirms();
}
