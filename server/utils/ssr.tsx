import React from 'react';
import ReactDOMServer from 'react-dom/server';
import * as ReactBeautifulDnD from 'react-beautiful-dnd';
import { Collection, InitialData, Attribution } from 'types';

export const renderToNodeStream = (res, reactElement) => {
	res.setHeader('content-type', 'text/html');
	res.write('<!DOCTYPE html>');
	ReactBeautifulDnD.resetServerContext();
	return ReactDOMServer.renderToNodeStream(reactElement).pipe(res);
};

type MetaProps = {
	initialData: InitialData;
	title: string;
	contextTitle?: string;
	description?: string;
	image?: string;
	attributions?: any[];
	doi?: string;
	publishedAt?: null | Date;
	unlisted?: boolean;
	collection?: Collection;
	pdfDownloadUrl?: string;
	textAbstract?: string;
	notes?: string[];
	canonicalUrl?: string;
};

const contributorRoles = ['Writing – Review & Editing', 'Editor', 'Series Editor'];
const sortAttributions = (foo, bar) => {
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
};

export const generateMetaComponents = (metaProps: MetaProps) => {
	const {
		initialData,
		title,
		contextTitle,
		description,
		image,
		attributions,
		doi,
		publishedAt,
		unlisted,
		collection,
		pdfDownloadUrl,
		textAbstract,
		notes,
		canonicalUrl,
	} = metaProps;
	const {
		title: communityTitle,
		citeAs: communityCiteAs,
		publishAs: communityPublisher,
	} = initialData.communityData;

	const url = `https://${initialData.locationData.hostname}${initialData.locationData.path}`;
	const favicon = initialData.communityData.favicon;
	const avatar = image || initialData.communityData.avatar;
	const titleWithContext = contextTitle ? `${title} · ${contextTitle}` : title;
	let outputComponents: any[] = [];
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

	if (communityTitle) {
		outputComponents = [
			...outputComponents,
			<meta key="sn1" property="og:site_name" content={communityTitle} />,
		];
	}

	if (communityTitle && !collection) {
		outputComponents = [
			...outputComponents,
			<meta key="sn2" name="citation_journal_title" content={communityTitle} />,
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

	if (collection) {
		outputComponents = [
			...outputComponents,
			<meta key="c0" name="citation_publisher" content={communityPublisher || 'PubPub'} />,
		];
		if (collection.kind === 'issue') {
			outputComponents = [
				...outputComponents,
				<meta key="c1" name="citation_journal_title" content={communityCiteAs} />,
				<meta key="c2" name="citation_volume" content={collection.metadata?.volume} />,
				<meta key="c3" name="citation_issue" content={collection.metadata?.issue} />,
				<meta
					key="c4"
					name="citation_issn"
					content={collection.metadata?.electronicIssn}
				/>,
				<meta key="c5" name="citation_issn" content={collection.metadata?.printIssn} />,
			];
		}
		if (collection.kind === 'book') {
			outputComponents = [
				...outputComponents,
				<meta key="c6" name="citation_inbook_title" content={collection.title} />,
				<meta key="c7" name="citation_book_title" content={collection.title} />,
				<meta key="c8" name="citation_isbn" content={collection.metadata?.isbn} />,
			];
		}
		if (collection.kind === 'conference') {
			outputComponents = [
				...outputComponents,
				<meta key="c9" name="citation_conference_title" content={collection.title} />,
			];
		}
	}

	if (pdfDownloadUrl) {
		outputComponents = [
			...outputComponents,
			<meta key="dl1" name="citation_pdf_url" content={pdfDownloadUrl} />,
		];
	}

	if (textAbstract) {
		outputComponents = [
			...outputComponents,
			<meta key="a1" name="citation_abstract" content={textAbstract} />,
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
		const authors = attributions.sort(sortAttributions).filter((item) => {
			return item.isAuthor && !item.roles;
		});

		const getPrimaryRole = (contributor: Attribution) => contributor.roles?.[0];
		const contributors = attributions.sort(sortAttributions).filter((item) => {
			const primaryRole = getPrimaryRole(item);
			return item.isAuthor && primaryRole && contributorRoles.includes(primaryRole);
		});

		const citationAuthorTags = authors.map((author) => {
			if (author.user) {
				return (
					<meta
						key={`author-cite-${author.id}`}
						name="citation_author"
						content={author.user.fullName}
					/>
				);
			}
			return (
				<meta
					key={`author-cite-${author.id}`}
					name="citation_author"
					content={author.name}
				/>
			);
		});
		const dcAuthorTags = authors.map((author) => {
			if (author.user) {
				return (
					<meta
						key={`author-dc-${author.id}`}
						name="dc.creator"
						content={author.user.fullName}
					/>
				);
			}
			return <meta key={`author-dc-${author.id}`} name="dc.creator" content={author.name} />;
		});
		const contributorRoleTags = contributors.map((contributor) => {
			if (contributor.user) {
				return (
					<meta
						key={`editor-cite-${contributor.id}`}
						name="citation_editor"
						content={contributor.user.fullName}
					/>
				);
			}
			return (
				<meta
					key={`editor-cite-${contributor.id}`}
					name="citation_editor"
					content={contributor.name}
				/>
			);
		});
		outputComponents = [
			...outputComponents,
			citationAuthorTags,
			dcAuthorTags,
			contributorRoleTags,
		];
	}

	if (publishedAt) {
		const googleScholarPublishedAt = `${publishedAt.getFullYear()}/${
			publishedAt.getMonth() + 1
		}/${publishedAt.getDate()}`;
		const dcPublishedAt = `${publishedAt.getFullYear()}-${publishedAt.getMonth()}-${publishedAt.getDate()}`;
		outputComponents = [
			...outputComponents,
			<meta key="pa1" property="article:published_time" content={String(publishedAt)} />,
			<meta key="pa2" property="dc.date" content={dcPublishedAt} />,
			<meta key="pa3" name="citation_publication_date" content={googleScholarPublishedAt} />,
			<meta key="pub1" property="dc.publisher" content={communityPublisher || 'PubPub'} />,
		];
	}

	if (doi) {
		outputComponents = [
			...outputComponents,
			<meta key="doi1" name="citation_doi" content={`doi:${doi}`} />,
			<meta key="doi2" property="dc.identifier" content={`doi:${doi}`} />,
			<meta key="doi3" property="prism.doi" content={`doi:${doi}`} />,
		];
	}

	if (notes) {
		const citationNoteTags = notes.map((note, i) => {
			// https://github.com/yannickcr/eslint-plugin-react/issues/1123
			// eslint-disable-next-line react/no-array-index-key
			return <meta key={`n${i}`} name="citation_reference" content={note} />;
		});
		outputComponents = [...outputComponents, citationNoteTags];
	}
	if (unlisted) {
		outputComponents = [
			...outputComponents,
			<meta key="un1" name="robots" content="noindex,nofollow" />,
		];
	}

	if (canonicalUrl) {
		outputComponents = [...outputComponents, <link rel="canonical" href={canonicalUrl} />];
	}

	outputComponents = [
		...outputComponents,
		<meta key="misc1" property="fb:app_id" content="924988584221879" />,
		<meta key="misc2" name="twitter:card" content="summary" />,
		<meta key="misc3" name="twitter:site" content="@pubpub" />,
	];

	return outputComponents;
};
