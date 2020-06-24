import { spawnSync, execSync } from 'child_process';
import Cite from 'citation-js';
import path from 'path';

import { getTmpFileForExtension } from '../export/util';
import { extensionFor } from './util';

const jatsToBibTransformerPath = path.join(__dirname, 'xslt', 'jats-to-bib.xsl');

export const extractRefBlocks = (pandocAst) => {
	const refsBlock = pandocAst.blocks.find(
		(block) => block.attrs && block.attrs.identifier === 'refs',
	);
	if (refsBlock) {
		return {
			pandocAst: {
				...pandocAst,
				blocks: pandocAst.blocks.filter((block) => block !== refsBlock),
			},
			refBlocks: refsBlock.content,
		};
	}
	return { pandocAst: pandocAst, refBlocks: null };
};

const extractUsingPandocCiteproc = (bibliographyTmpPath) => {
	const proc = spawnSync('pandoc-citeproc', ['-j', bibliographyTmpPath]);
	const output = proc.stdout.toString();
	const cslJson = JSON.parse(output);
	return Object.fromEntries(
		cslJson.map((entry) => {
			const structuredValue = Cite.get.bibtex.text([entry]);
			return [entry.id, { structuredValue: structuredValue }];
		}),
	);
};

const getBibPathFromXslTransform = async (documentTmpPath) => {
	const { path: bibFilePath } = await getTmpFileForExtension('bib');
	execSync(`xsltproc --novalid -o ${bibFilePath} ${jatsToBibTransformerPath} ${documentTmpPath}`);
	return bibFilePath;
};

export const extractBibliographyItems = async ({ bibliography, document, extractBibFromJats }) => {
	if (bibliography) {
		return extractUsingPandocCiteproc(bibliography.tmpPath);
	}
	if (document && extensionFor(document.tmpPath) === 'xml' && extractBibFromJats) {
		const generatedBibPath = await getBibPathFromXslTransform(document.tmpPath);
		return extractUsingPandocCiteproc(generatedBibPath);
	}
	return {};
};
