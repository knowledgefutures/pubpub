/* eslint-disable no-restricted-syntax */
import fs from 'fs-extra';
import path from 'path';
import YAML from 'yaml';
import tmp from 'tmp-promise';
import filesize from 'filesize';
import jp from 'jsonpath';
import { Op } from 'sequelize';
import { Node, Fragment, Slice } from 'prosemirror-model';
import { ReplaceStep } from 'prosemirror-transform';

import { buildSchema, createFirebaseChange } from 'components/Editor/utils';
import { getPubDraftRef } from 'server/utils/firebaseAdmin';
import { createPub as createPubQuery } from 'server/pub/queries';
import { createCollection } from 'server/collection/queries';
import { createCollectionPub } from 'server/collectionPub/queries';
import { Collection, PubAttribution } from 'server/models';
import { extensionToPandocFormat, bibliographyFormats } from 'utils/import/formats';

import { setSummarizeParentScopesOnPubCreation } from 'server/scopeSummary';
import { getFullPathsInDir, extensionFor } from '../../util';
import { importFiles } from '../../import';
import { uploadFileToAssetStore, getUrlForAssetKey } from '../../assetStore';
import { BulkImportError } from '../errors';
import { pathMatchesPattern } from '../paths';
import { runMacrosOnSourceFiles } from '../macros';
import { getAttributionAttributes, cloneWithKeys } from './util';

type FileEntry = { tmpPath: string; clientPath: string; label: null | string };

const pubAttributesFromMetadata = ['title', 'description', 'slug', 'customPublishedAt', 'metadata'];
const pubAttributesFromDirective = [
	'avatar',
	'customPublishedAt',
	'description',
	'doi',
	'downloads',
	'slug',
	'title',
];
const documentExtensions = Object.keys(extensionToPandocFormat);
const documentSchema = buildSchema();

const getSourcesForAttributeStrategy = (directive) => {
	const { attributeStrategy: strategy } = directive;
	if (!strategy || strategy === 'merge') {
		return { import: true, directive: true };
	}
	if (strategy === 'import') {
		return { import: true };
	}
	if (strategy === 'directive') {
		return { directive: true };
	}
	throw new BulkImportError(
		{ directive },
		`Invalid attributeStrategy ${strategy}. Must be one of "merge", "import", "directive"`,
	);
};

const createPubAttributions = async (pub, proposedMetadata, directive) => {
	const { attributions: proposedAttributions = [] } = proposedMetadata;
	const { matchSlugsToAttributions = [] } = directive;
	const sources = getSourcesForAttributeStrategy(directive);
	let attributionsAttrs: any[] = [];
	if (sources.import) {
		const matchedProposedAttributions = proposedAttributions.map((proposedAttr) => {
			const { name, users } = proposedAttr;
			if (users) {
				const matchedUser = users.find((user) =>
					matchSlugsToAttributions.includes(user.slug),
				);
				const userId = matchedUser && matchedUser.id;
				return { name, userId };
			}
			return proposedAttr;
		});
		attributionsAttrs = [...attributionsAttrs, ...matchedProposedAttributions];
	}
	if (sources.directive && Array.isArray(directive.attributions)) {
		attributionsAttrs = [...attributionsAttrs, ...directive.attributions];
	}
	await Promise.all(
		attributionsAttrs.map(async (attrDirective, index, { length }) => {
			const resolvedAttrs = await getAttributionAttributes(attrDirective);
			return PubAttribution.create({
				pubId: pub.id,
				order: 1 / 2 ** (length - index),
				...resolvedAttrs,
			});
		}),
	);
};

const resolveDirectiveValue = async (value, context) => {
	const { $fileSize, $sourceFile, $metadata, $docQuery } = value;
	const { sourceFiles, rawMetadata, assetUrlForTmpPath, doc, withLeafValue = (x) => x } = context;
	if ($docQuery) {
		return jp.value(doc, $docQuery);
	}
	if ($fileSize) {
		const pathLike = await resolveDirectiveValue($fileSize, context);
		const sourceFile = sourceFiles.find(
			(sf) => sf.clientPath && pathMatchesPattern(sf.clientPath, pathLike),
		);
		const stat = await fs.stat(sourceFile.tmpPath);
		return filesize(stat.size);
	}
	if ($sourceFile) {
		const pathLike = await resolveDirectiveValue($sourceFile, context);
		if (pathLike) {
			const sourceFile = sourceFiles.find(
				(sf) => sf.clientPath && pathMatchesPattern(sf.clientPath, pathLike),
			);
			if (sourceFile) {
				const { tmpPath } = sourceFile;
				const existingAssetUrl = assetUrlForTmpPath[tmpPath];
				if (existingAssetUrl) {
					return existingAssetUrl;
				}
				const assetKey = await uploadFileToAssetStore(tmpPath);
				const url = getUrlForAssetKey(assetKey);
				assetUrlForTmpPath[tmpPath] = url;
				return url;
			}
		}
		console.warn(`warning: cannot find sourceFile matching ${pathLike}`);
		return null;
	}
	if ($metadata) {
		return resolveDirectiveValue($metadata, {
			...context,
			withLeafValue: (key) => rawMetadata[key],
		});
	}
	if (Array.isArray(value)) {
		return Promise.all(value.map((innerValue) => resolveDirectiveValue(innerValue, context)));
	}
	if (value && typeof value === 'object') {
		const res = {};
		await Promise.all(
			Object.entries(value).map(async ([key, innerValue]) => {
				res[key] = await resolveDirectiveValue(innerValue, context);
			}),
		);
		return res;
	}
	return withLeafValue(value);
};

const resolveDirectiveValues = async (directive, sourceFiles, rawMetadata, doc): Promise<any> => {
	const resolvedDirective = {};
	const context = { sourceFiles, rawMetadata, assetUrlForTmpPath: {}, doc };
	await Promise.all(
		Object.entries(directive).map(async ([key, value]) => {
			const resolvedValue = await resolveDirectiveValue(value, context);
			resolvedDirective[key] = resolvedValue;
		}),
	);
	return resolvedDirective;
};

const createPub = async ({ communityId, directive, proposedMetadata }) => {
	const sources = getSourcesForAttributeStrategy(directive);
	const attributes = {
		communityId,
		...(sources.import && cloneWithKeys(proposedMetadata, pubAttributesFromMetadata)),
		...(sources.directive && cloneWithKeys(directive, pubAttributesFromDirective)),
	};
	return createPubQuery(attributes as any);
};

const createPubTags = async (directive, pubId, communityId) => {
	const { tags } = directive;
	if (tags) {
		const extractedTags = tags
			.reduce((acc, next) => {
				if (Array.isArray(next)) {
					return [...acc, ...next];
				}
				return [...acc, next];
			}, [])
			.filter((x) => x);
		return Promise.all(
			extractedTags.map(async (tagName) => {
				const existingCollection = await Collection.findOne({
					where: {
						communityId,
						title: {
							[Op.iLike]: tagName,
						},
					},
				});
				const tag =
					existingCollection ||
					(await createCollection({
						communityId,
						title: tagName,
						kind: 'tag',
					}));
				await createCollectionPub({ collectionId: tag.id, pubId });
				return existingCollection ? null : tag;
			}),
		).then((createdTags) => createdTags.filter((x) => x));
	}
	return [];
};

const gatherLocalSourceFilesForPub = async (
	targetPath,
	isTargetDirectory,
): Promise<FileEntry[]> => {
	if (isTargetDirectory) {
		return getFullPathsInDir(targetPath).map((tmpPath) => {
			return {
				tmpPath,
				clientPath: path.relative(targetPath, tmpPath),
				label: null,
			};
		});
	}
	return [{ tmpPath: targetPath, clientPath: path.basename(targetPath), label: null }];
};

const gatherNonLocalSourceFilesForPub = async (
	targetPath: string,
	isTargetDirectory: boolean,
	directive: any,
) => {
	const { resolve: sourcesToResolve } = directive;

	if (!sourcesToResolve) {
		return [];
	}

	const fullPathToTargetDirectory = isTargetDirectory ? targetPath : path.dirname(targetPath);

	const joinPaths = (prefix, suffix) => {
		if (prefix.startsWith('http')) {
			return prefix + suffix;
		}
		return path.join(prefix, suffix);
	};

	const getRelativePathAndOptions = (entry) => {
		if (typeof entry === 'string') {
			return { pathToEntrypoint: entry, options: {} };
		}
		const [[relativePathToEntrypoint, options]] = Object.entries(entry) as [string, any][];
		return { relativePathToEntrypoint, options };
	};

	const safeStat = async (fullPathToEntrypoint, swallowError) => {
		try {
			const stat = await fs.stat(fullPathToEntrypoint);
			return stat;
		} catch (err) {
			if (swallowError) {
				return null;
			}
			throw err;
		}
	};

	const resolveEntry = async (entry): Promise<FileEntry[]> => {
		const { relativePathToEntrypoint, options } = getRelativePathAndOptions(entry);
		const fullPathToEntrypoint = path.join(
			fullPathToTargetDirectory,
			relativePathToEntrypoint as string,
		);
		const stat = await safeStat(fullPathToEntrypoint, options.ignoreIfMissing);

		if (!stat) {
			return [];
		}

		const resolveFile = (fullPathToFile): FileEntry => {
			const { as, into, label } = options;
			if (as) {
				return { tmpPath: fullPathToFile, clientPath: as, label };
			}
			const pathFromEntrypointToFile = path.relative(fullPathToEntrypoint, fullPathToFile);
			const clientPath = into
				? joinPaths(into, pathFromEntrypointToFile)
				: relativePathToEntrypoint;
			return { tmpPath: fullPathToFile, clientPath, label };
		};

		if (stat.isDirectory()) {
			return getFullPathsInDir(fullPathToEntrypoint).map(resolveFile);
		}
		return [resolveFile(fullPathToEntrypoint)];
	};

	return (Promise.all(sourcesToResolve.map(resolveEntry)) as Promise<FileEntry[][]>).then((arr) =>
		arr.reduce((a, b) => [...a, ...b], []),
	);
};

const labelGatheredSourceFiles = (sourceFiles: FileEntry[], directive: any) => {
	const {
		labels: {
			document: documentPath = null,
			bibliography: bibliographyPath = null,
			supplements: supplementPaths = [],
			preambles: preamblePaths = [],
		} = {},
	} = directive;
	let hasDocument = sourceFiles.some((file) => file.label === 'document');
	let hasBibliography = sourceFiles.some((file) => file.label === 'bibliography');
	const labelledFiles: FileEntry[] = [];
	for (const sourceFile of sourceFiles) {
		const { clientPath } = sourceFile;
		const extension = extensionFor(clientPath);
		if (
			!hasDocument &&
			(!documentPath || documentPath === clientPath) &&
			documentExtensions.includes(extension)
		) {
			hasDocument = true;
			labelledFiles.push({ ...sourceFile, label: 'document' });
		} else if (
			!hasBibliography &&
			(!bibliographyPath || bibliographyPath === clientPath) &&
			bibliographyFormats.includes(extension)
		) {
			hasBibliography = true;
			labelledFiles.push({ ...sourceFile, label: 'bibliography' });
		} else if (supplementPaths.includes(clientPath)) {
			labelledFiles.push({ ...sourceFile, label: 'supplement' });
		} else if (preamblePaths.includes(clientPath)) {
			labelledFiles.push({ ...sourceFile, label: 'preamble' });
		} else {
			labelledFiles.push(sourceFile);
		}
	}
	return labelledFiles;
};

const getDocumentAndMaybeYamlPreamble = async (document, directive) => {
	const { extractMetadataFromDocument } = directive;
	const isMarkdown = document.tmpPath.endsWith('.md');
	if (!isMarkdown && extractMetadataFromDocument) {
		const documentContent = (await fs.readFile(document.tmpPath)).toString();
		const match = documentContent.match(/---([\s\S]*?)---/);
		if (match) {
			const [block, extractedPandocYamlString] = match;
			const documentWithoutBlock = documentContent.replace(block, '');
			const { path: nextDocumentPath } = await tmp.file({
				postfix: `.${extensionFor(document.tmpPath)}`,
			});
			await fs.writeFile(nextDocumentPath, documentWithoutBlock);
			return {
				document: {
					label: 'document',
					tmpPath: nextDocumentPath,
					clientPath: nextDocumentPath,
				},
				extractedPandocYamlString,
			};
		}
	}
	return { document };
};

const createPandocMetadataFile = async (directive, extractedPandocYamlString) => {
	const { pandocMetadata } = directive;
	const yamlString = pandocMetadata ? YAML.stringify(pandocMetadata) : extractedPandocYamlString;
	if (yamlString) {
		const { path: tmpPath } = await tmp.file({ postfix: '.yaml' });
		await fs.writeFile(tmpPath, yamlString);
		return { tmpPath, label: 'metadata' };
	}
	return null;
};

const createPreambleFile = async (directive) => {
	const { preamble } = directive;
	if (preamble) {
		const { path: tmpPath } = await tmp.file();
		await fs.writeFile(tmpPath, preamble);
		return { tmpPath, label: 'preamble' };
	}
	return null;
};

const createPreambleFiles = async (directive, sourceFiles) => {
	const document = sourceFiles.find((sf) => sf.label === 'document');
	const notDocument = sourceFiles.filter((sf) => sf !== document);
	const { document: nextDocument, extractedPandocYamlString } =
		await getDocumentAndMaybeYamlPreamble(document, directive);
	const pandocMetadataFile = await createPandocMetadataFile(directive, extractedPandocYamlString);
	const preambleFile = await createPreambleFile(directive);
	return [preambleFile, pandocMetadataFile, nextDocument, ...notDocument].filter((x) => x);
};

const getImportableFiles = async (directive, targetPath) => {
	const { macros } = directive;
	const stat = await fs.lstat(targetPath);
	const isTargetDirectory = stat.isDirectory();
	const localFiles = await gatherLocalSourceFilesForPub(targetPath, isTargetDirectory);
	const nonLocalFiles = await gatherNonLocalSourceFilesForPub(
		targetPath,
		isTargetDirectory,
		directive,
	);
	const gatheredSourceFiles = [...localFiles, ...nonLocalFiles];
	const sourceFiles = labelGatheredSourceFiles(gatheredSourceFiles, directive);
	const sourceFilesWithPreambles = await createPreambleFiles(directive, sourceFiles);
	if (macros) {
		return runMacrosOnSourceFiles(sourceFilesWithPreambles, macros);
	}
	return sourceFilesWithPreambles;
};

const addFileNodeToDocument = (document, fileNodeAttrs) => {
	return {
		...document,
		content: [...document.content, { type: 'file', attrs: fileNodeAttrs }],
	};
};

const writeDocumentToPubDraft = async (pubId, document) => {
	const draftRef = await getPubDraftRef(pubId);
	const hydratedDocument = Node.fromJSON(documentSchema, document);
	const documentSlice = new Slice(Fragment.from(hydratedDocument.content), 0, 0);
	const replaceStep = new ReplaceStep(0, 0, documentSlice);
	const change = createFirebaseChange([replaceStep], 'bulk-importer');
	await draftRef.child('changes').child('0').set(change);
};

export const resolvePubDirective = async ({ directive, targetPath, community, collection }) => {
	const { importerFlags = {} } = directive;
	const sourceFiles = await getImportableFiles(directive, targetPath);
	const tmpDir = await tmp.dir();
	const importResult = await importFiles({
		tmpDirPath: tmpDir.path,
		sourceFiles,
		importerFlags,
		provideRawMetadata: true,
	});
	const { warnings, proposedMetadata, rawMetadata } = importResult;
	let { doc } = importResult;

	setSummarizeParentScopesOnPubCreation(false);

	const resolvedDirective = await resolveDirectiveValues(
		directive,
		sourceFiles,
		rawMetadata,
		doc,
	);
	const { inlineFile } = resolvedDirective;

	const pub = await createPub({
		communityId: community.id,
		directive: resolvedDirective,
		proposedMetadata,
	});
	await createPubAttributions(pub, proposedMetadata, resolvedDirective);

	if (inlineFile) {
		doc = addFileNodeToDocument(doc, inlineFile);
	}

	await writeDocumentToPubDraft(pub.id, doc);

	const createdTags = await createPubTags(resolvedDirective, pub.id, community.id);
	if (collection) {
		await createCollectionPub({ collectionId: collection.id, pubId: pub.id, isPrimary: true });
	}

	// eslint-disable-next-line no-console
	console.log('created Pub:', pub.title);

	setSummarizeParentScopesOnPubCreation(true);

	return {
		pub,
		collection: createdTags,
		warnings,
		created: true,
	};
};
