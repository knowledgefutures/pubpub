import {
	callPandoc,
	emitPandocJson,
	parsePandocJson,
	transformUtil,
} from '@pubpub/prosemirror-pandoc';
import { exec as execWithCallback } from 'child_process';

const { flatten } = transformUtil;

const getHtmlStringForPandocDoc = (document) =>
	callPandoc(JSON.stringify(emitPandocJson(document)), 'json', 'html').trim();

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

export const exec = (command) =>
	new Promise((resolve, reject) =>
		execWithCallback(command, (err, res) => {
			if (err) {
				return reject(err);
			}
			return resolve(res);
		}),
	);
