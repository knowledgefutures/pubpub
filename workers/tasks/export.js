import fs from 'fs';
import Promise from 'bluebird';
import nodePandoc from 'node-pandoc';
import tmp from 'tmp-promise';
import AWS from 'aws-sdk';
import React from 'react';
import dateFormat from 'dateformat';
import ReactDOMServer from 'react-dom/server';
import YAML from 'yaml';
import { buildSchema, renderStatic, jsonToNode, getNotes } from '@pubpub/editor';

import ensureUserForAttribution from 'shared/utils/ensureUserForAttribution';
import { getPubPublishedDate, getPubUpdatedDate } from 'shared/pub/pubDates';
import { SimpleNotesList } from 'components';
import { Branch, Pub, PubAttribution, User } from '../../server/models';
import { generateHash } from '../../server/utils';
import { getBranchDoc } from '../../server/utils/firebaseAdmin';
import { generateCiteHtmls } from '../../server/editor/queries';

AWS.config.setPromisesDependency(Promise);
const s3bucket = new AWS.S3({ params: { Bucket: 'assets.pubpub.org' } });

tmp.setGracefulCleanup();
const dataDir =
	process.env.NODE_ENV === 'production' ? '--data-dir=/app/.apt/usr/share/pandoc/data ' : '';

const formatTypes = {
	docx: { output: 'docx', extension: 'docx' },
	// pdf: { output: 'latex', extension: 'pdf', flags: ` --pdf-engine=xelatex --template=${__dirname}/template.tex` },
	pdf: { output: 'latex', extension: 'pdf', flags: ' --pdf-engine=xelatex' },
	epub: { output: 'epub', extension: 'epub' },
	html: { output: 'html', extension: 'html' },
	markdown: { output: 'markdown_strict', extension: 'md' },
	odt: { output: 'odt', extension: 'odt' },
	plain: { output: 'plain', extension: 'txt' },
	jats: { output: 'jats', extension: 'xml' },
	tex: { output: 'latex', extension: 'tex' },
};

// Interface - buttons to export in different formats.
// On click, we check if we already have a rendered or default file for that format.
// If no existing file, we send off a request that adds an item to the queue.
// We need to handle 1) chapters, 2) drafts

/*
- get json from pubpub, convert to HTML, enter into pandoc, upload output, return url
- get file, enter into pandoc, get html, convert into pubpub json
- Have a 'check task' route and 'task' table that can be queried for task results
*/

const filterNonExportableNodes = (nodes, filterHorizontalRules) =>
	nodes.filter(
		(n) =>
			!(n.type === 'discussion' || (filterHorizontalRules && n.type === 'horizontal_rule')),
	);

const healBrokenImageCaptions = (nodes) =>
	nodes.map((node) => {
		if (node.type !== 'image') {
			return node;
		}
		const healedCaption = node.attrs.caption.split('<br>').join('');
		return {
			...node,
			attrs: {
				...node.attrs,
				caption: healedCaption,
			},
		};
	});

const hideEquationChildren = (nodes) =>
	nodes.map((node) => {
		if (node.type === 'equation' || node.type === 'block_equation') {
			return {
				...node,
				attrs: {
					...node.attrs,
					renderForPandoc: true,
				},
			};
		}
		if (node.content) {
			return {
				...node,
				content: hideEquationChildren(node.content),
			};
		}
		return node;
	});

const createStaticHtml = async (pubData, branchDoc, format) => {
	const { title } = pubData;
	const { content: branchDocNodes } = branchDoc;
	const schema = buildSchema();
	const doc = jsonToNode(branchDoc, schema);
	const { footnotes: rawFootnotes, citations: rawCitations } = getNotes(doc);
	const footnotes = await generateCiteHtmls(rawFootnotes);
	const citations = await generateCiteHtmls(rawCitations);
	const publishedDate = getPubPublishedDate(pubData);
	const updatedDate = getPubUpdatedDate(pubData);
	const publishedDateString = publishedDate && dateFormat(publishedDate, 'mmm dd, yyyy');
	const updatedDateString = updatedDate && dateFormat(updatedDate, 'mmm dd, yyyy');
	const showUpdatedDate = updatedDateString && updatedDateString !== publishedDateString;
	return ReactDOMServer.renderToStaticMarkup(
		<html lang="en">
			<head>
				<title>{title}</title>
			</head>
			<body>
				{showUpdatedDate && (
					<div>
						<strong>Updated on:</strong> {updatedDateString}
					</div>
				)}
				{pubData.doi && (
					<div>
						<strong>DOI:</strong> {pubData.doi}
					</div>
				)}
				{renderStatic(
					schema,
					hideEquationChildren(
						healBrokenImageCaptions(
							filterNonExportableNodes(branchDocNodes, format === 'pdf'),
						),
					),
					{},
				)}
				<SimpleNotesList title="Footnotes" notes={footnotes} />
				<SimpleNotesList title="Citations" notes={citations} />
			</body>
		</html>,
	);
};

const createYamlMetadataFile = async (pubData) => {
	const publishedDate = getPubPublishedDate(pubData);
	const dateString = publishedDate && dateFormat(publishedDate, 'mmm dd, yyyy');
	const metadata = YAML.stringify({
		author: pubData.attributions
			.concat()
			.sort((a, b) => a.order - b.order)
			.map((attr) => ensureUserForAttribution(attr).user.fullName),
		...(dateString && { date: dateString }),
	});
	const file = await tmp.file({ extension: '.yaml' });
	fs.writeFileSync(file.path, metadata);
	return file;
};

const callPandoc = (staticHtml, metadataFile, tmpFile, format) => {
	const args = `${dataDir}-f html -t ${formatTypes[format].output}${formatTypes[format].flags ||
		''} -o ${tmpFile.path} --metadata-file=${metadataFile.path}`;
	return new Promise((resolve, reject) => {
		nodePandoc(staticHtml, args, (err, result) => {
			if (err && err.message) {
				console.warn(err.message);
			}
			/* This callback is called multiple times */
			/* err is sent multiple times and includes warnings */
			/* So to check if the file generated, check the size */
			/* of the tmp file. */
			const wroteToFile = !!fs.statSync(tmpFile.path).size;
			if (result && wroteToFile) {
				resolve(result);
			}
			if (result && !wroteToFile) {
				reject(new Error('Error in Pandoc'));
			}
		});
	});
};

const uploadDocument = (branchId, readableStream, extension) => {
	const key = `${generateHash(8)}/${branchId}.${extension}`;
	const params = {
		Key: key,
		Body: readableStream,
		ACL: 'public-read',
	};
	return new Promise((resolve, reject) => {
		s3bucket.upload(params, (err) => {
			if (err) {
				reject(err);
			}
			resolve({ url: `https://assets.pubpub.org/${key}` });
		});
	});
};

export const exportTask = async (pubId, branchId, format) => {
	const { extension } = formatTypes[format];
	const pubData = await Pub.findOne({
		where: { id: pubId },
		include: [
			{ model: Branch, as: 'branches' },
			{
				model: PubAttribution,
				as: 'attributions',
				include: [
					{
						model: User,
						as: 'user',
					},
				],
			},
		],
	});
	const tmpFile = await tmp.file({ postfix: `.${extension}` });
	const { content: branchDoc } = await getBranchDoc(pubId, branchId);
	const staticHtml = await createStaticHtml(pubData, branchDoc, format);
	const metadataFile = await createYamlMetadataFile(pubData);
	await callPandoc(staticHtml, metadataFile, tmpFile, format);
	return uploadDocument(branchId, fs.createReadStream(tmpFile.path), extension);
};
