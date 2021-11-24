/* eslint-disable no-underscore-dangle, react/no-array-index-key, react/prop-types, global-require */
import path from 'path';
import fs from 'fs';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { DocJson } from 'types';
import { renderStatic, editorSchema } from 'components/Editor';
import { getLicenseBySlug } from 'utils/licenses';

import { NotesData, PubMetadata } from './types';
import { digestCitation } from './util';
import SimpleNotesList from './SimpleNotesList';

const nonExportableNodeTypes = ['discussion'];
const katexCdnPrefix = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.13.18/';
const bullet = ' • ';

// This script is provided by the "cjk-fonts" Web Fonts project that we manage from here:
// https://fonts.adobe.com/my_fonts#web_projects-section
const loadCjkFontsScript = `
(function(d) {
  var config = {
	kitId: 'seb8nix',
	scriptTimeout: 3000,
	async: true
  },
  h=d.documentElement,t=setTimeout(function(){h.className=h.className.replace(/\bwf-loading\b/g,"")+" wf-inactive";},config.scriptTimeout),tk=d.createElement("script"),f=false,s=d.getElementsByTagName("script")[0],a;h.className+=" wf-loading";tk.src='https://use.typekit.net/'+config.kitId+'.js';tk.async=true;tk.onload=tk.onreadystatechange=function(){a=this.readyState;if(f||a&&a!="complete"&&a!="loaded")return;f=true;clearTimeout(t);try{Typekit.load(config)}catch(e){}};s.parentNode.insertBefore(tk,s)
})(document);
`;

const createCss = () => {
	const entrypoint = path.join(__dirname, 'styles', 'printDocument.scss');
	const cssPath = path.join(__dirname, 'styles', 'printDocument.css');
	// HACK(ian): We use node-sass to build a CSS bundle that is used by our HTML/PDF exports.
	// Unfortunately, the export task runs in a thread managed by the worker_threads API, which
	// node-sass does not support (see https://github.com/sass/node-sass/issues/2746). So we will
	// just generate the bundle once per Heroku deploy and save it to a file.
	if (!fs.existsSync(cssPath)) {
		const nodeSass = require('node-sass');
		const nodeModulesPath = path.join(process.env.PWD!, 'node_modules');
		const clientPath = path.join(process.env.PWD!, 'client');
		const entrypointContents = fs.readFileSync(entrypoint).toString();
		const data = '$PUBPUB_EXPORT: true;\n' + entrypointContents;
		const css = nodeSass
			.renderSync({
				data,
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

const getCitationLinkage = (unstructuredValue, structuredValue) => {
	const digest = digestCitation(unstructuredValue, structuredValue);
	return {
		inlineElementId: `citation-${digest}-inline`,
		bottomElementId: `citation-${digest}-bottom`,
	};
};

const getFootnoteLinkage = (index) => {
	return {
		inlineElementId: `fn-${index}-inline`,
		bottomElementId: `fn-${index}-bottom`,
	};
};

const addHrefsToNotes = (nodes) => {
	let footnoteIndex = -1;
	return addAttrsToNodes(
		(node) => {
			if (node.type === 'citation') {
				const { inlineElementId, bottomElementId } = getCitationLinkage(
					node.attrs.unstructuredValue,
					node.attrs.value,
				);
				return {
					href: `#${bottomElementId}`,
					id: inlineElementId,
				};
			}
			if (node.type === 'footnote') {
				footnoteIndex++;
				const { inlineElementId, bottomElementId } = getFootnoteLinkage(footnoteIndex);
				return {
					href: `#${bottomElementId}`,
					id: inlineElementId,
				};
			}
			return {};
		},
		['citation', 'footnote'],
		nodes,
	);
};

const blankIframes = (nodes) =>
	addAttrsToNodes(
		{
			url: 'data:text/html;charset=utf-8,%3Chtml%3E%3Cbody%20frameborder%3D%220%22%20style%3D%22background-color%3A%23ccc%3Bborder%3A0%3Btext-align%3Acenter%3B%22%3EVisit%20the%20web%20version%20of%20this%20article%20to%20view%20interactive%20content.%3C%2Fbody%3E%3C%2Fhtml%3E',
			height: '50',
		},
		['iframe'],
		nodes,
	);

const renderDetails = ({ updatedDateString, publishedDateString, doi, licenseSlug }) => {
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
					<strong>License:</strong>&nbsp;
					{/* @ts-expect-error ts-migrate(2322) FIXME: Type 'string | null' is not assignable to type 'st... Remove this comment to see the full error message */}
					<a href={license.link}>
						{license.full} ({license.slug.toUpperCase()} {license.version})
					</a>
				</div>
			)}
		</>
	);
};

const renderFrontMatter = ({
	updatedDateString,
	publishedDateString,
	primaryCollectionTitle,
	doi,
	title,
	communityTitle,
	accentColor,
	attributions,
	licenseSlug,
	publisher,
}: PubMetadata) => {
	const affiliations = [
		...new Set(attributions.map((attr) => attr.affiliation).filter((x) => x)),
	];
	// do not put community title if this is a book
	const communityAndCollectionString =
		(publisher ? '' : communityTitle + bullet) + (primaryCollectionTitle || '');
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
									<sup>{index + 1}</sup>
									{aff}
									{index < affiliations.length - 1 && ', '}
								</span>
							))}
						</h5>
					)}
				</div>
			)}
			<h4>{publisher || ''}</h4>
			<div className="details">
				{publishedDateString && (
					<div>
						<strong>Published on: </strong> {publishedDateString}
					</div>
				)}
				{renderDetails({
					updatedDateString,
					publishedDateString,
					doi,
					licenseSlug,
				})}
			</div>
		</section>
	);
};

type RenderStaticHtmlOptions = {
	pubDoc: DocJson;
	pubMetadata: PubMetadata;
	notesData: NotesData;
};

export const renderStaticHtml = async (options: RenderStaticHtmlOptions) => {
	const { pubDoc, pubMetadata, notesData } = options;
	const { title, nodeLabels } = pubMetadata;
	const { footnotes, citations, noteManager } = notesData;
	const renderableNodes = [filterNonExportableNodes, addHrefsToNotes, blankIframes]
		.filter((x): x is (nodes: any) => any => !!x)
		.reduce((nodes, fn) => fn(nodes), pubDoc.content);

	const docContent = renderStatic({
		schema: editorSchema,
		doc: { type: 'doc', content: renderableNodes },
		noteManager,
		nodeLabels,
	});

	return ReactDOMServer.renderToStaticMarkup(
		<html lang="en">
			<head>
				<title>{title}</title>
				<meta charSet="utf-8" />
				{/* eslint-disable-next-line react/no-danger */}
				<style type="text/css" dangerouslySetInnerHTML={{ __html: staticCss }} />
				{/* eslint-disable-next-line react/no-danger */}
				<script dangerouslySetInnerHTML={{ __html: loadCjkFontsScript }} />
			</head>
			<body>
				{renderFrontMatter(pubMetadata)}
				<div className="pub-body-component">
					<div className="editor Prosemirror">
						{docContent}
						<div className="pub-notes">
							<SimpleNotesList
								title="Footnotes"
								notes={footnotes}
								getLinkage={(_, index) => getFootnoteLinkage(index)}
							/>
							<SimpleNotesList
								title="Citations"
								notes={citations}
								getLinkage={(note) =>
									getCitationLinkage(note.unstructuredValue, note.structuredValue)
								}
							/>
						</div>
					</div>
				</div>
			</body>
		</html>,
	);
};
