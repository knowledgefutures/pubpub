/* eslint-disable no-underscore-dangle, react/no-array-index-key, react/prop-types, global-require */
import path from 'path';
import fs from 'fs';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { renderStatic, buildSchema } from 'components/Editor';

import { SimpleNotesList } from 'components';
import { getLicenseBySlug } from 'utils/licenses';

const nonExportableNodeTypes = ['discussion'];
const katexCdnPrefix = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.11.1/';
const citationPrefix = 'cite';
const footnotePrefix = 'fn';
const bullet = ' • ';

const createCss = () => {
	const cssPath = path.join(__dirname, 'styles', 'printDocument.css');
	// HACK(ian): We use node-sass to build a CSS bundle that is used by our HTML/PDF exports.
	// Unfortunately, the export task runs in a thread managed by the worker_threads API, which
	// node-sass does not support (see https://github.com/sass/node-sass/issues/2746). So we will
	// just generate the bundle once per Heroku deploy and save it to a file.
	if (!fs.existsSync(cssPath)) {
		const nodeSass = require('node-sass');
		const nodeModulesPath = path.join(process.env.PWD, 'node_modules');
		const clientPath = path.join(process.env.PWD, 'client');
		const css = nodeSass
			.renderSync({
				file: path.join(__dirname, 'styles', 'printDocument.scss'),
				includePaths: [nodeModulesPath, clientPath],
				importer: (url) => {
					if (url.startsWith('~')) {
						return { file: path.join(nodeModulesPath, url.slice(1)) };
					}
					return null;
				},
			})
			.css.toString()
			// Find all things like url(fonts/KaTeX_whatever) and replace them with a version that
			// is loaded from an external CDN.
			.replace(
				/url\((fonts\/KaTeX_(?:[A-z0-9\-_]*?).(?:[A-z0-9]+))\)/g,
				(_, fontPath) => `url(${katexCdnPrefix + fontPath})`,
			);
		fs.writeFileSync(cssPath, css);
	}
	return fs.readFileSync(cssPath).toString();
};

const staticCss = createCss();

const filterNonExportableNodes = (nodes) =>
	nodes.filter((n) => !nonExportableNodeTypes.includes(n.type));

const addAttrsToNodes = (newAttrs, matchNodeTypes, nodes) =>
	nodes.map((node) => {
		if (matchNodeTypes.includes(node.type)) {
			return {
				...node,
				attrs: {
					...node.attrs,
					...(typeof newAttrs === 'function' ? newAttrs(node) || {} : newAttrs),
				},
			};
		}
		if (node.content) {
			return {
				...node,
				content: addAttrsToNodes(newAttrs, matchNodeTypes, node.content),
			};
		}
		return node;
	});

const renderEquationsAsScripts = (nodes) =>
	addAttrsToNodes({ renderForPandoc: true }, ['equation', 'block_equation'], nodes);

const addHrefsToNotes = (nodes) =>
	addAttrsToNodes(
		(node) => {
			const { count } = node.attrs;
			if (node.type === 'citation') {
				return {
					href: `#${citationPrefix}-${count}`,
					id: `${citationPrefix}-${count}-return`,
				};
			}
			if (node.type === 'footnote') {
				return {
					href: `#${footnotePrefix}-${count}`,
					id: `${footnotePrefix}-${count}-return`,
				};
			}
			return {};
		},
		['citation', 'footnote'],
		nodes,
	);

const blankIframes = (nodes) =>
	addAttrsToNodes(
		{
			url:
				'data:text/html;charset=utf-8,%3Chtml%3E%3Cbody%20frameborder%3D%220%22%20style%3D%22background-color%3A%23ccc%3Bborder%3A0%3Btext-align%3Acenter%3B%22%3EVisit%20the%20web%20version%20of%20this%20article%20to%20view%20interactive%20content.%3C%2Fbody%3E%3C%2Fhtml%3E',
			height: '50',
		},
		['iframe'],
		nodes,
	);

const renderSharedDetails = ({ updatedDateString, publishedDateString, doi, licenseSlug }) => {
	const showUpdatedDate = updatedDateString && updatedDateString !== publishedDateString;
	const license = getLicenseBySlug(licenseSlug);
	return (
		<>
			{showUpdatedDate && (
				<div>
					<strong>Updated on:</strong> {updatedDateString}
				</div>
			)}
			{doi && (
				<div>
					<strong>DOI:</strong> {doi}
				</div>
			)}
			{license && (
				<div>
					<strong>License:</strong>{' '}
					<a href={license.link}>
						{license.full} ({license.slug.toUpperCase()} {license.version})
					</a>
				</div>
			)}
		</>
	);
};

const renderFrontMatterForPandoc = (
	{
		updatedDateString,
		publishedDateString,
		communityTitle,
		primaryCollectionTitle,
		doi,
		licenseSlug,
	},
	targetPandoc,
) => {
	const pandocFormatsWithoutTemplate = ['docx', 'plain', 'odt'];
	const communityAndCollectionString =
		communityTitle + (primaryCollectionTitle ? bullet + primaryCollectionTitle : '');
	return (
		<>
			{pandocFormatsWithoutTemplate.includes(targetPandoc) && (
				<h3>{communityAndCollectionString}</h3>
			)}
			{renderSharedDetails({
				updatedDateString: updatedDateString,
				publishedDateString: publishedDateString,
				doi: doi,
				licenseSlug: licenseSlug,
			})}
		</>
	);
};

const renderFrontMatterForHtml = ({
	updatedDateString,
	publishedDateString,
	primaryCollectionTitle,
	doi,
	title,
	communityTitle,
	accentColor,
	attributions,
	licenseSlug,
}) => {
	const affiliations = [
		...new Set(attributions.map((attr) => attr.affiliation).filter((x) => x)),
	];
	const communityAndCollectionString =
		communityTitle + (primaryCollectionTitle ? bullet + primaryCollectionTitle : '');
	return (
		<section className="cover">
			<h3 className="community-and-collection">{communityAndCollectionString}</h3>
			<h1 className="title" style={{ color: accentColor }}>
				{title}
			</h1>
			{attributions.length > 0 && (
				<div className="byline">
					<h3>
						{attributions.map((attr, index) => {
							const {
								user: { fullName },
								affiliation,
							} = attr;
							const affiliationNumber =
								affiliation && affiliations.includes(affiliation)
									? 1 + affiliations.indexOf(affiliation)
									: null;
							return (
								<span className="name" key={index}>
									{fullName}
									{affiliationNumber && <sup>{affiliationNumber}</sup>}
									{index < attributions.length - 1 && ', '}
								</span>
							);
						})}
					</h3>
					{affiliations.length > 0 && (
						<h5>
							{affiliations.map((aff, index) => (
								<span className="affiliation" key={index}>
									{<sup>{index + 1}</sup>}
									{aff}
									{index < affiliations.length - 1 && ', '}
								</span>
							))}
						</h5>
					)}
				</div>
			)}
			<div className="details">
				{publishedDateString && (
					<div>
						<strong>Published on: </strong> {publishedDateString}
					</div>
				)}
				{renderSharedDetails({
					updatedDateString: updatedDateString,
					publishedDateString: publishedDateString,
					doi: doi,
					licenseSlug: licenseSlug,
				})}
			</div>
		</section>
	);
};

export const createStaticHtml = async (
	{ prosemirrorDoc, pubMetadata, citations, footnotes, citationInlineStyle },
	targetPandoc,
	targetPaged,
) => {
	const { title } = pubMetadata;

	const renderableNodes = [
		filterNonExportableNodes,
		targetPandoc && renderEquationsAsScripts,
		!targetPandoc && addHrefsToNotes,
		targetPaged && blankIframes,
	]
		.filter((x) => x)
		.reduce((nodes, fn) => fn(nodes), prosemirrorDoc.content);

	const docContent = renderStatic(
		buildSchema(
			{},
			{},
			{
				citation: {
					citationsRef: { current: citations },
					citationInlineStyle: citationInlineStyle,
				},
			},
		),
		renderableNodes,
		{},
	);

	return ReactDOMServer.renderToStaticMarkup(
		<html lang="en">
			<head>
				<title>{title}</title>
				<meta charSet="utf-8" />
				{!targetPandoc && (
					// eslint-disable-next-line react/no-danger
					<style type="text/css" dangerouslySetInnerHTML={{ __html: staticCss }} />
				)}
			</head>
			<body>
				{targetPandoc
					? renderFrontMatterForPandoc(pubMetadata, targetPandoc)
					: renderFrontMatterForHtml(pubMetadata)}
				<div className="pub-body-component">
					<div className="editor Prosemirror">
						{docContent}
						<div className="pub-notes">
							<SimpleNotesList
								title="Footnotes"
								notes={footnotes}
								prefix={footnotePrefix}
							/>
							<SimpleNotesList
								title="Citations"
								notes={citations}
								prefix={citationPrefix}
							/>
						</div>
					</div>
				</div>
			</body>
		</html>,
	);
};
