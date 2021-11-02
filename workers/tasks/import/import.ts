/* eslint-disable no-restricted-syntax */
import path from 'path';
import { spawnSync } from 'child_process';
import { parsePandocJson, fromPandoc, setPandocApiVersion } from '@pubpub/prosemirror-pandoc';

import { extensionToPandocFormat } from 'utils/import/formats';

import { rules } from './rules';
import { downloadAndConvertFiles } from './download';
import { extractBibliographyItems } from './bibliography';
import { uploadExtractedMedia } from './extractedMedia';
import { extensionFor } from './util';
import { runTransforms } from './transforms';
import { getProposedMetadata, getRawMetadata } from './metadata';
import { getTmpDirectoryPath } from './tmpDirectory';
import { createTransformResources } from './resources';

setPandocApiVersion([1, 22]);

const dataRoot = process.env.NODE_ENV === 'production' ? '/app/.apt/usr/share/pandoc/data ' : '';

const createPandocArgs = (pandocFormat, tmpDirPath, metadataPath) => {
	const shouldExtractMedia = ['odt', 'docx', 'epub'].includes(pandocFormat);
	return [
		dataRoot && [`--data-dir=${dataRoot}`],
		['-f', pandocFormat],
		['-t', 'json'],
		metadataPath && [`--metadata-file=${metadataPath}`],
		shouldExtractMedia && [`--extract-media=${path.join(tmpDirPath, 'media')}`],
		pandocFormat === 'latex' && ['--verbose'],
	]
		.filter((x): x is string[] => !!x)
		.reduce((acc, next) => [...acc, ...next], []);
};

const callPandoc = (tmpDirPath, files, args) => {
	const proc = spawnSync('pandoc', [...files, ...args], {
		maxBuffer: 1024 * 1024 * 25,
		cwd: tmpDirPath,
	});
	const output = proc.stdout.toString();
	const error = proc.stderr.toString();
	return { output, error };
};

export const categorizeSourceFiles = (sourceFiles) => {
	const preambles = sourceFiles.filter((file) => file.label === 'preamble');
	const document = sourceFiles.find((file) => file.label === 'document');
	const metadata = sourceFiles.find((file) => file.label === 'metadata');
	const bibliography = sourceFiles.find((file) => file.label === 'bibliography');
	const supplements = sourceFiles.filter((file) => file.label === 'supplement');
	if (!document) {
		throw new Error('No target document specified.');
	}
	return {
		preambles,
		document,
		bibliography,
		supplements,
		metadata,
	};
};

const getPandocAst = ({
	documentPath,
	preamblePaths,
	supplementPaths,
	metadataPath,
	tmpDirPath,
	importerFlags,
}) => {
	const extension = extensionFor(documentPath);
	const pandocFormat = importerFlags.pandocFormat || extensionToPandocFormat[extension];
	if (!pandocFormat) {
		throw new Error(`Cannot find Pandoc format for .${extension} file.`);
	}
	let pandocRawAst;
	let pandocError;
	try {
		const pandocResult = callPandoc(
			path.dirname(documentPath),
			[...preamblePaths, documentPath, ...supplementPaths],
			createPandocArgs(pandocFormat, tmpDirPath, metadataPath),
		);
		pandocError = pandocResult.error;
		pandocRawAst = JSON.parse(pandocResult.output);
	} catch (err) {
		throw new Error(
			`Conversion from ${path.basename(documentPath)} failed. Pandoc says: ${pandocError}`,
		);
	}
	return {
		pandocErrorOutput: pandocError,
		pandocAst: runTransforms(parsePandocJson(pandocRawAst), importerFlags),
	};
};

export const importFiles = async ({
	sourceFiles,
	tmpDirPath,
	provideRawMetadata = false,
	importerFlags = {},
}) => {
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'keepStraightQuotes' does not exist on ty... Remove this comment to see the full error message
	const { keepStraightQuotes, skipJatsBibExtraction } = importerFlags;
	const { preambles, document, bibliography, supplements, metadata } =
		categorizeSourceFiles(sourceFiles);
	const { pandocAst, pandocErrorOutput } = getPandocAst({
		documentPath: document.tmpPath,
		metadataPath: metadata && metadata.tmpPath,
		preamblePaths: preambles.map((p) => p.tmpPath),
		supplementPaths: supplements.map((s) => s.tmpPath),
		tmpDirPath,
		importerFlags,
	});
	const [extractedMedia, bibliographyItems] = await Promise.all([
		uploadExtractedMedia(tmpDirPath),
		extractBibliographyItems({
			bibliography,
			document,
			extractBibFromJats: !skipJatsBibExtraction,
		}),
	]);
	const resources = createTransformResources({
		sourceFiles: [...sourceFiles, ...extractedMedia],
		document,
		bibliographyItems,
	});
	const prosemirrorDoc = fromPandoc(pandocAst, rules, {
		resources,
		useSmartQuotes: !keepStraightQuotes,
		prosemirrorDocWidth: 675,
	}).asNode();
	const [proposedMetadata] = await Promise.all([
		getProposedMetadata(pandocAst.meta),
		resources.uploadPendingResources(),
	]);
	return {
		doc: prosemirrorDoc,
		warnings: resources.getWarnings(),
		pandocErrorOutput,
		proposedMetadata,
		...(provideRawMetadata && { rawMetadata: getRawMetadata(pandocAst.meta) }),
	};
};

export const importTask = async ({ sourceFiles: clientSourceFilesList, importerFlags }) => {
	const tmpDirPath = await getTmpDirectoryPath();
	const sourceFiles = await downloadAndConvertFiles(clientSourceFilesList, tmpDirPath);
	return importFiles({
		sourceFiles,
		importerFlags,
		tmpDirPath,
	}).catch((error) => ({
		error: {
			message: error.toString(),
			stack: error.stack.toString(),
		},
	}));
};
