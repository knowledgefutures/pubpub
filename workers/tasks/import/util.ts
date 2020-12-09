import path from 'path';
import fs from 'fs-extra';
import { spawn as spawnChildProcess } from 'child_process';
import {
	callPandoc,
	emitPandocJson,
	parsePandocJson,
	transformUtil,
} from '@pubpub/prosemirror-pandoc';

const { flatten } = transformUtil;

const getHtmlStringForPandocDoc = (document) =>
	callPandoc(JSON.stringify(emitPandocJson(document)), 'json', 'html').trim();

const getPlainForPandocDoc = (document) =>
	callPandoc(JSON.stringify(emitPandocJson(document)), 'json', 'plain').trim();

const getPandocDocForHtmlString = (htmlString) =>
	parsePandocJson(JSON.parse(callPandoc(htmlString, 'html', 'json')));

export const pandocInlineToHtmlString = (nodes) => {
	if (nodes.length === 0) {
		return '';
	}
	const doc = {
		type: 'Doc',
		blocks: [{ type: 'Para', content: nodes }],
		meta: {},
	};
	return getHtmlStringForPandocDoc(doc);
};

export const pandocInlineToPlain = (nodes) => {
	if (nodes.length === 0) {
		return '';
	}
	const doc = {
		type: 'Doc',
		blocks: [{ type: 'Para', content: nodes }],
		meta: {},
	};
	return getPlainForPandocDoc(doc);
};

export const pandocBlocksToHtmlString = (blocks) => {
	if (blocks.length === 0) {
		return '';
	}
	const doc = {
		type: 'Doc',
		blocks: blocks,
		meta: {},
	};
	return getHtmlStringForPandocDoc(doc);
};

export const htmlStringToPandocInline = (htmlString) => {
	if (htmlString.length === 0) {
		return [];
	}
	const pandocAst = getPandocDocForHtmlString(htmlString);
	return flatten(
		pandocAst.blocks
			.filter((block) => block.type === 'Plain' || block.type === 'Para')
			.map((block) => block.content),
	);
};

export const htmlStringToPandocBlocks = (htmlString) => {
	if (htmlString.length === 0) {
		return [];
	}
	const pandocAst = getPandocDocForHtmlString(htmlString);
	return pandocAst.blocks;
};

export const extensionFor = (filePath) =>
	filePath
		.split('.')
		.pop()
		.toLowerCase();

export const spawn = (command, args) =>
	new Promise((resolve, reject) => {
		const ps = spawnChildProcess(command, args);
		ps.on('close', () => resolve());
		ps.stderr.on('data', (err) => reject(err.toString()));
	});

export const getFullPathsInDir = (dir) => {
	let paths = [];
	fs.readdirSync(dir).forEach((file) => {
		const fullPath = path.join(dir, file);
		if (fs.lstatSync(fullPath).isDirectory()) {
			paths = paths.concat(getFullPathsInDir(fullPath));
		} else {
			// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string' is not assignable to par... Remove this comment to see the full error message
			paths.push(fullPath);
		}
	});
	return paths;
};
