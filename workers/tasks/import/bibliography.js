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

const createIdToCiteGetter = (array, processEntry) => {
	const map = new Map();
	array.forEach((entry) => {
		const [key, value] = processEntry(entry);
		map.set(key, value);
	});
	return (id) => map.get(id);
};

const extractUsingPandocCiteproc = (bibliographyTmpPath) => {
	const proc = spawnSync('pandoc-citeproc', ['-j', bibliographyTmpPath]);
	const output = proc.stdout.toString();
	const cslJson = JSON.parse(output);
	return createIdToCiteGetter(cslJson, (entry) => {
		const structuredValue = Cite.get.bibtex.text([entry]);
		return [entry.id, { structuredValue: structuredValue }];
	});
};

const getBibPathFromXslTransform = async (documentTmpPath) => {
	const { path: bibFilePath } = await getTmpFileForExtension('bib');
	execSync(`xsltproc --novalid -o ${bibFilePath} ${jatsToBibTransformerPath} ${documentTmpPath}`);
	return bibFilePath;
};

export const extractBibliographyItems = async ({ bibliographyTmpPath, documentTmpPath }) => {
	if (bibliographyTmpPath) {
		return extractUsingPandocCiteproc(bibliographyTmpPath);
	}
	if (documentTmpPath && extensionFor(documentTmpPath) === 'xml') {
		const generatedBibPath = await getBibPathFromXslTransform(documentTmpPath);
		return extractUsingPandocCiteproc(generatedBibPath);
	}
	return () => null;
};
