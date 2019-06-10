import React from 'react';
import ReactDOMServer from 'react-dom/server';
import * as ReactBeautifulDnD from 'react-beautiful-dnd';
import { resolve } from 'path';
import queryString from 'query-string';
import amqplib from 'amqplib';
import { remove as removeDiacritics } from 'diacritics';
import { Collection, Community, Page, User } from '../models';

const isPubPubProduction = !!process.env.PUBPUB_PRODUCTION;

export const checkIfSuperAdmin = (userId) => {
	const adminIds = ['b242f616-7aaa-479c-8ee5-3933dcf70859'];
	return adminIds.includes(userId);
};

export const attributesPublicUser = [
	'id',
	'firstName',
	'lastName',
	'fullName',
	'avatar',
	'slug',
	'initials',
	'title',
];

export const slugifyString = (input) => {
	if (typeof input !== 'string') {
		console.error('input is not a valid string');
		return '';
	}

	return removeDiacritics(input)
		.replace(/ /g, '-')
		.replace(/[^a-zA-Z0-9-]/gi, '')
		.toLowerCase();
};

export const hostIsValid = (req, access) => {
	const isBasePubPub = req.hostname === 'www.pubpub.org';
	if (!isBasePubPub && access !== 'community') {
		return false;
	}
	if (isBasePubPub && access !== 'pubpub') {
		return false;
	}
	return true;
};

export const renderToNodeStream = (res, reactElement) => {
	res.setHeader('content-type', 'text/html');
	ReactBeautifulDnD.resetServerContext();
	return ReactDOMServer.renderToNodeStream(reactElement).pipe(res);
};

export const getInitialData = (req) => {
	const hostname = req.hostname;
	const whereQuery =
		hostname.indexOf('.pubpub.org') > -1
			? { subdomain: hostname.replace('.pubpub.org', '') }
			: { domain: hostname };

	/* Gather user data */
	const user = req.user || {};
	const loginData = {
		id: user.id || null,
		initials: user.initials,
		slug: user.slug,
		fullName: user.fullName,
		firstName: user.firstName,
		lastName: user.lastName,
		avatar: user.avatar,
		title: user.title,
	};

	/* Gather location data */
	const locationData = {
		hostname: req.hostname,
		path: req.path,
		params: req.params,
		query: req.query,
		queryString: req.query ? `?${queryString.stringify(req.query)}` : '',
		isBasePubPub: hostname === 'www.pubpub.org',
		isPubPubProduction: isPubPubProduction,
	};

	/* If basePubPub - return fixed data */
	if (locationData.isBasePubPub) {
		return new Promise((resolvePromise) => {
			resolvePromise({
				communityData: {
					title: 'PubPub',
					description: 'Collaborative Community Publishing',
					favicon: `https://${locationData.hostname}/favicon.png`,
					avatar: `https://${locationData.hostname}/static/logo.png`,
					headerLogo:
						locationData.path === '/'
							? '/static/logoWhite.svg'
							: '/static/logoBlack.svg',
					hideHero: true,
					accentColor: '#112233',
					accentTextColor: '#FFFFFF',
					accentActionColor: 'rgba(17, 34, 51, 0.6)',
					accentHoverColor: 'rgba(17, 34, 51, 0.8)',
					accentMinimalColor: 'rgba(17, 34, 51, 0.2)',
					hideCreatePubButton: true,
					headerLinks: [
						{ title: 'About', url: '/about' },
						{ title: 'Pricing', url: '/pricing' },
						{ title: 'Search', url: '/search' },
						{ title: 'Contact', url: 'mailto:team@pubpub.org', external: true },
					],
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
			exclude: ['createdAt', 'updatedAt'],
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
					exclude: ['createdAt', 'updatedAt', 'communityId'],
				},
			},
			{
				model: User,
				as: 'admins',
				through: { attributes: [] },
				attributes: ['id', 'slug', 'fullName', 'initials', 'avatar'],
			},
			{
				model: Collection,
				as: 'collections',
				separate: true,
			},
		],
	}).then((communityResult) => {
		if (!communityResult) {
			throw new Error('Community Not Found');
		}

		const communityData = communityResult.toJSON();

		loginData.isAdmin = communityData.admins.reduce((prev, curr) => {
			if (curr.id === user.id) {
				return true;
			}
			return prev;
		}, false);

		const availablePages = {};
		communityData.pages = communityData.pages.filter((item) => {
			if (
				!loginData.isAdmin &&
				!item.isPublic &&
				locationData.query.access !== item.viewHash
			) {
				return false;
			}

			availablePages[item.id] = {
				id: item.id,
				title: item.title,
				slug: item.slug,
			};
			return true;
		});

		communityData.collections = communityData.collections.filter((item) => {
			return loginData.isAdmin || item.isPublic;
		});

		communityData.collections = communityData.collections.map((collection) => {
			if (!collection.pageId) {
				return collection;
			}
			return {
				...collection,
				page: availablePages[collection.pageId],
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

export const generateMetaComponents = ({
	initialData,
	title,
	contextTitle,
	description,
	image,
	attributions,
	doi,
	publishedAt,
	unlisted,
}) => {
	const siteName = initialData.communityData.title;
	const url = `https://${initialData.locationData.hostname}${initialData.locationData.path}`;
	const favicon = initialData.communityData.favicon;
	const avatar = image || initialData.communityData.avatar;
	const titleWithContext = contextTitle ? `${title} · ${contextTitle}` : title;
	let outputComponents = [];

	if (!initialData.locationData.isBasePubPub) {
		outputComponents = [
			...outputComponents,
			<link
				key="rss1"
				rel="alternate"
				type="application/rss+xml"
				title={`${title} RSS Feed`}
				href={`https://${initialData.locationData.hostname}/rss.xml`}
			/>,
		];
	}

	if (title) {
		outputComponents = [
			...outputComponents,
			<title key="t1">{titleWithContext}</title>,
			<meta key="t2" property="og:title" content={titleWithContext} />,
			<meta key="t3" name="twitter:title" content={titleWithContext} />,
			<meta key="t4" name="twitter:image:alt" content={titleWithContext} />,
			<meta key="t5" name="citation_title" content={title} />,
			<meta key="t6" name="dc.title" content={title} />,
		];
	}

	if (siteName) {
		outputComponents = [
			...outputComponents,
			<meta key="sn1" property="og:site_name" content={siteName} />,
		];
	}

	if (contextTitle) {
		outputComponents = [
			...outputComponents,
			<meta key="sn2" property="citation_journal_title" content={contextTitle} />,
		];
	}

	if (url) {
		outputComponents = [
			...outputComponents,
			<meta key="u1" property="og:url" content={url} />,
			<meta
				key="u2"
				property="og:type"
				content={url.indexOf('/pub/') > -1 ? 'article' : 'website'}
			/>,
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
		const authors = attributions
			.sort((foo, bar) => {
				if (foo.order < bar.order) {
					return -1;
				}
				if (foo.order > bar.order) {
					return 1;
				}
				if (foo.createdAt < bar.createdAt) {
					return 1;
				}
				if (foo.createdAt > bar.createdAt) {
					return -1;
				}
				return 0;
			})
			.filter((item) => {
				return item.isAuthor;
			});
		const citationAuthorTags = authors.map((author) => {
			return (
				<meta
					key={`author-cite-${author.id}`}
					name="citation_author"
					content={author.user.fullName}
				/>
			);
		});
		const dcAuthorTags = authors.map((author) => {
			return (
				<meta
					key={`author-dc-${author.id}`}
					name="dc.creator"
					content={author.user.fullName}
				/>
			);
		});
		outputComponents = [...outputComponents, citationAuthorTags, dcAuthorTags];
	}

	if (publishedAt) {
		const googleScholarPublishedAt = `${publishedAt.getFullYear()}/${publishedAt.getMonth() +
			1}/${publishedAt.getDate()}`;
		outputComponents = [
			...outputComponents,
			<meta key="pa1" property="article:published_time" content={publishedAt} />,
			<meta
				key="pa2"
				property="citation_publication_date"
				content={googleScholarPublishedAt}
			/>,
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
			<meta key="un1" name="robots" content="noindex,nofollow" />,
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

export const handleErrors = (req, res, next) => {
	return (err) => {
		if (err.message === 'Community Not Found') {
			return res
				.status(404)
				.sendFile(resolve(__dirname, '../errorPages/communityNotFound.html'));
		}
		if (err.message.indexOf('DraftRedirect:') === 0) {
			const slug = err.message.split(':')[1];
			return res.redirect(`/pub/${slug}/draft`);
		}
		if (
			err.message === 'Page Not Found' ||
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

/* Worker Queue Tasks */
const queueName = 'pubpubTaskQueue';
let openChannel;

const setOpenChannel = () => {
	amqplib.connect(process.env.CLOUDAMQP_URL).then((conn) => {
		return conn.createConfirmChannel().then((channel) => {
			return channel.assertQueue(queueName, { durable: true }).then(() => {
				openChannel = channel;
			});
		});
	});
};
setOpenChannel();

export function addWorkerTask(message) {
	if (!openChannel) {
		setOpenChannel();
	}
	openChannel.sendToQueue(queueName, Buffer.from(message), { deliveryMode: true });
	return openChannel.waitForConfirms();
}
