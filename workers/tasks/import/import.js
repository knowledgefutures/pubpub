/* eslint-disable no-restricted-syntax */
import path from 'path';
import { spawnSync } from 'child_process';
import { parsePandocJson, fromPandoc, setPandocApiVersion } from '@pubpub/prosemirror-pandoc';

import pandocRules from './rules';
import { downloadAndConvertFiles } from './download';
import { extractBibliographyItems } from './bibliography';
import { uploadExtractedMedia } from './extractedMedia';
import { extensionFor } from './util';
import { runTransforms } from './transforms/runTransforms';
import { getProposedMetadata } from './metadata';
import { getTmpDirectoryPath } from './tmpDirectory';

setPandocApiVersion([1, 20]);

export const extensionToPandocFormat = {
	docx: 'docx',
	epub: 'epub',
	html: 'html',
	md: 'markdown',
	odt: 'odt',
	txt: 'markdown_strict',
	xml: 'jats',
	tex: 'latex',
};

const dataRoot = process.env.NODE_ENV === 'production' ? '/app/.apt/usr/share/pandoc/data ' : '';

const createPandocArgs = (pandocFormat, tmpDirPath) => {
	const shouldExtractMedia = ['odt', 'docx', 'epub'].includes(pandocFormat);
	return [
		dataRoot && [`--data-dir=${dataRoot}`],
		['-f', pandocFormat],
		['-t', 'json'],
		shouldExtractMedia && [`--extract-media=${path.join(tmpDirPath, 'media')}`],
	]
		.filter((x) => x)
		.reduce((acc, next) => [...acc, ...next], []);
};

const callPandoc = (tmpDirPath, files, args) => {
	const proc = spawnSync('pandoc', [...files, ...args], {
		maxBuffer: 1024 * 1024 * 25,
		cwd: tmpDirPath,
	});
	const output = proc.stdout.toString();
	const error = proc.stderr.toString();
	return { output: output, error: error };
};

const createUrlGetter = (sourceFiles, documentLocalPath) => (resourcePath) => {
	// First, try to find a file in the uploads with the exact path
	for (const { localPath, url } of sourceFiles) {
		if (resourcePath === localPath) {
			return url;
		}
	}
	// Then, try to find a file in the uploads with the same relative path
	const documentContainer = path.dirname(documentLocalPath);
	for (const { localPath, url } of sourceFiles) {
		const relativePathWithExtension = path.relative(documentContainer, localPath);
		const relativePathSansExtension = relativePathWithExtension
			.split('.')
			.slice(0, -1)
			.join('.');
		if (
			resourcePath === relativePathWithExtension ||
			resourcePath === relativePathSansExtension
		) {
			return url;
		}
	}
	// Having failed, just look for a source file with the same name as the requested file.
	const baseName = path.basename(resourcePath);
	for (const { localPath, url } of sourceFiles) {
		if (path.basename(localPath) === baseName) {
			return url;
		}
	}
	return null;
};

const createTransformResourceGetter = (getUrlByLocalPath, getBibliographyItemById, warnings) => (
	resource,
	context,
) => {
	if (context === 'citation') {
		const item = getBibliographyItemById(resource);
		if (item) {
			return item;
		}
		warnings.push({ type: 'missingCitation', id: resource });
		return { structuredValue: '', unstructuredValue: '' };
	}
	if (context === 'image') {
		if (resource.startsWith('http://') || resource.startsWith('https://')) {
			return resource;
		}
		const url = getUrlByLocalPath(resource);
		if (url) {
			return `https://assets.pubpub.org/${url}`;
		}
		warnings.push({ type: 'missingImage', path: resource });
		return resource;
	}
	return resource;
};

const categorizeSourceFiles = (sourceFiles) => {
	const document = sourceFiles.find((file) => file.label === 'document');
	const bibliography = sourceFiles.find((file) => file.label === 'bibliography');
	const supplements = sourceFiles.filter((file) => file.label === 'supplement');
	if (!document) {
		throw new Error('No target document specified.');
	}
	return {
		document: document,
		bibliography: bibliography,
		supplements: supplements,
	};
};

const getPandocAst = ({ documentPath, supplementPaths, tmpDirPath, importerFlags }) => {
	const extension = extensionFor(documentPath);
	const pandocFormat = extensionToPandocFormat[extension];
	if (!pandocFormat) {
		throw new Error(`Cannot find Pandoc format for .${extension} file.`);
	}
	let pandocRawAst;
	let pandocError;
	try {
		const pandocResult = callPandoc(
			path.dirname(documentPath),
			[documentPath, ...supplementPaths],
			createPandocArgs(pandocFormat, tmpDirPath),
		);
		pandocError = pandocResult.error;
		pandocRawAst = JSON.parse(pandocResult.output);
	} catch (err) {
		throw new Error(
			`Conversion from ${path.basename(
				document.localPath,
			)} failed. Pandoc says: ${pandocError}`,
		);
	}
	return runTransforms(parsePandocJson(pandocRawAst), importerFlags);
};

const importFiles = async ({ sourceFiles: clientSourceFiles, importerFlags = {} }) => {
	const { keepStraightQuotes, skipJatsBibExtraction } = importerFlags;
	const tmpDirPath = await getTmpDirectoryPath();
	const sourceFiles = await downloadAndConvertFiles(clientSourceFiles, tmpDirPath);
	const { document, bibliography, supplements } = categorizeSourceFiles(sourceFiles);
	const pandocAst = getPandocAst({
		documentPath: document.tmpPath,
		supplementPaths: supplements.map((s) => s.tmpPath),
		tmpDirPath: tmpDirPath,
		importerFlags: importerFlags,
	});
	const extractedMedia = await uploadExtractedMedia(tmpDirPath);
	const getBibliographyItemById = await extractBibliographyItems({
		bibliographyTmpPath: bibliography && bibliography.tmpPath,
		documentTmpPath: !skipJatsBibExtraction && document.tmpPath,
	});
	const getUrlByLocalPath = createUrlGetter(
		[...sourceFiles, ...extractedMedia],
		document.localPath,
	);
	const warnings = [];
	const prosemirrorDoc = fromPandoc(pandocAst, pandocRules, {
		resource: createTransformResourceGetter(
			getUrlByLocalPath,
			getBibliographyItemById,
			warnings,
		),
		useSmartQuotes: !keepStraightQuotes,
	}).asNode();
	const proposedMetadata = await getProposedMetadata(pandocAst.meta);
	return { doc: prosemirrorDoc, warnings: warnings, proposedMetadata: proposedMetadata };
};

export const importTask = ({ sourceFiles, importerFlags }) =>
	importFiles({ sourceFiles: sourceFiles, importerFlags: importerFlags }).catch((error) => ({
		error: {
			message: error.toString(),
			stack: error.stack.toString(),
		},
	}));
