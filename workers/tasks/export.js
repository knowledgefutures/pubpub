import fs from 'fs';
import Promise from 'bluebird';
import nodePandoc from 'node-pandoc';
import tmp from 'tmp-promise';
import AWS from 'aws-sdk';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { buildSchema, renderStatic, jsonToNode, getNotes } from '@pubpub/editor';

import { SimpleNotesList } from 'components';
import { Pub } from '../../server/models';
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

const filterNonExportableNodes = (nodes) => nodes.filter((n) => n.type !== 'discussion');

const createStaticHtml = async (pubTitle, branchDoc) => {
	const { content: branchDocNodes } = branchDoc;
	const schema = buildSchema();
	const doc = jsonToNode(branchDoc, schema);
	const { footnotes: rawFootnotes, citations: rawCitations } = getNotes(doc);
	const footnotes = await generateCiteHtmls(rawFootnotes);
	const citations = await generateCiteHtmls(rawCitations);
	return ReactDOMServer.renderToStaticMarkup(
		<html lang="en">
			<head>
				<title>{pubTitle}</title>
			</head>
			<body>
				{renderStatic(schema, filterNonExportableNodes(branchDocNodes), {})}
				<SimpleNotesList title="Footnotes" notes={footnotes} />
				<SimpleNotesList title="Citations" notes={citations} />
			</body>
		</html>,
	);
};

const callPandoc = (staticHtml, tmpFile, format) => {
	const args = `${dataDir}-f html -t ${formatTypes[format].output}${formatTypes[format].flags ||
		''} -o ${tmpFile.path}`;
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

export default async (pubId, branchId, format) => {
	const { extension } = formatTypes[format];
	const pubData = await Pub.findOne({ where: { id: pubId } });
	const tmpFile = await tmp.file({ postfix: `.${extension}` });
	const { content: branchDoc } = await getBranchDoc(pubId, branchId);
	const staticHtml = await createStaticHtml(pubData.title, branchDoc);
	await callPandoc(staticHtml, tmpFile, format);
	return uploadDocument(branchId, fs.createReadStream(tmpFile.path), extension);
};
