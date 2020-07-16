/* eslint-disable no-restricted-syntax */
import fs from 'fs-extra';
import path from 'path';
import YAML from 'yaml';
import tmp from 'tmp-promise';
import { Op } from 'sequelize';
import { Node, Fragment, Slice } from 'prosemirror-model';
import { ReplaceStep } from 'prosemirror-transform';

import { buildSchema, createFirebaseChange } from 'components/Editor/utils';
import { getBranchRef } from 'server/utils/firebaseAdmin';
import { createPub as createPubQuery } from 'server/pub/queries';
import { createCollection } from 'server/collection/queries';
import { createCollectionPub } from 'server/collectionPub/queries';
import { Branch, Collection, PubAttribution } from 'server/models';
import { extensionToPandocFormat, bibliographyFormats } from 'utils/import/formats';

import { getFullPathsInDir, extensionFor } from '../../util';
import { importFiles } from '../../import';
import { uploadFileToAssetStore, getUrlForAssetKey } from '../../assetStore';
import { BulkImportError } from '../errors';
import { pathMatchesPattern } from '../paths';
import { runMacrosOnSourceFiles } from '../macros';
import { getAttributionAttributes, cloneWithKeys } from './util';

const pubAttributesFromMetadata = ['title', 'description', 'slug', 'customPublishedAt', 'metadata'];
const pubAttributesFromDirective = [
	'avatar',
	'citationInlineStyle',
	'citationStyle',
	'customPublishedAt',
	'description',
	'doi',
	'headerBackgroundColor',
	'headerBackgroundImage',
	'headerStyle',
	'licenseSlug',
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
		{ directive: directive },
		`Invalid attributeStrategy ${strategy}. Must be one of "merge", "import", "directive"`,
	);
};

const createPubAttributions = async (pub, proposedMetadata, directive) => {
	const { attributions: proposedAttributions = [] } = proposedMetadata;
	const { matchSlugsToAttributions = [] } = directive;
	const sources = getSourcesForAttributeStrategy(directive);
	let attributionsAttrs = [];
	if (sources.import) {
		const matchedProposedAttributions = proposedAttributions.map((proposedAttr) => {
			const { name, users } = proposedAttr;
			if (users) {
				const matchedUser = users.find((user) =>
					matchSlugsToAttributions.includes(user.slug),
				);
				const userId = matchedUser && matchedUser.id;
				return { name: name, userId: userId };
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
	const { $sourceFile, $metadata } = value;
	const { sourceFiles, rawMetadata } = context;
	if ($sourceFile) {
		const pathLike = await resolveDirectiveValue($sourceFile, context);
		if (pathLike) {
			const sourceFile = sourceFiles.find((sf) =>
				pathMatchesPattern(sf.clientPath, pathLike),
			);
			if (sourceFile) {
				const assetKey = await uploadFileToAssetStore(sourceFile.tmpPath);
				return getUrlForAssetKey(assetKey);
			}
		}
		console.warn(`warning: cannot find sourceFile matching ${pathLike}`);
		return null;
	}
	if ($metadata) {
		const key = await resolveDirectiveValue($metadata, context);
		return rawMetadata[key];
	}
	return value;
};

const resolveDirectiveValues = async (directive, sourceFiles, rawMetadata) => {
	const resolvedDirective = {};
	const context = { sourceFiles: sourceFiles, rawMetadata: rawMetadata };
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
		communityId: communityId,
		...(sources.import && cloneWithKeys(proposedMetadata, pubAttributesFromMetadata)),
		...(sources.directive && cloneWithKeys(directive, pubAttributesFromDirective)),
	};
	return createPubQuery(attributes);
};

const createPubTags = async (directive, pubId, communityId) => {
	const { tags } = directive;
	if (tags) {
		return Promise.all(
			tags.map(async (tagName) => {
				const existingCollection = await Collection.findOne({
					where: {
						title: {
							[Op.iLike]: tagName,
						},
					},
				});
				const tag =
					existingCollection ||
					(await createCollection({
						communityId: communityId,
						title: tagName,
						kind: 'tag',
					}));
				await createCollectionPub({ collectionId: tag.id, pubId: pubId });
				return existingCollection ? null : tag;
			}),
		).then((createdTags) => createdTags.filter((x) => x));
	}
	return [];
};

const gatherLocalSourceFilesForPub = async (targetPath, isTargetDirectory) => {
	if (isTargetDirectory) {
		return getFullPathsInDir(targetPath).map((tmpPath) => {
			return { tmpPath: tmpPath, clientPath: path.relative(targetPath, tmpPath) };
		});
	}
	return [{ tmpPath: targetPath, clientPath: path.basename(targetPath) }];
};

const gatherNonLocalSourceFilesForPub = async (targetPath, isTargetDirectory, directive) => {
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
		const [[relativePathToEntrypoint, options]] = Object.entries(entry);
		return { relativePathToEntrypoint: relativePathToEntrypoint, options: options };
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

	const resolveEntry = async (entry) => {
		const { relativePathToEntrypoint, options } = getRelativePathAndOptions(entry);
		const fullPathToEntrypoint = path.join(fullPathToTargetDirectory, relativePathToEntrypoint);
		const stat = await safeStat(fullPathToEntrypoint, options.ignoreIfMissing);

		if (!stat) {
			return [];
		}

		const resolveFile = (fullPathToFile) => {
			const { as, into, label } = options;
			if (as) {
				return { tmpPath: fullPathToFile, clientPath: as, label: label };
			}
			const pathFromEntrypointToFile = path.relative(fullPathToEntrypoint, fullPathToFile);
			const clientPath = into
				? joinPaths(into, pathFromEntrypointToFile)
				: relativePathToEntrypoint;
			return { tmpPath: fullPathToFile, clientPath: clientPath, label: label };
		};

		if (stat.isDirectory()) {
			return getFullPathsInDir(fullPathToEntrypoint).map(resolveFile);
		}
		return [resolveFile(fullPathToEntrypoint)];
	};

	return Promise.all(sourcesToResolve.map(resolveEntry)).then((arr) =>
		arr.reduce((a, b) => [...a, ...b], []),
	);
};

const labelGatheredSourceFiles = (sourceFiles, directive) => {
	const {
		labels: {
			document: documentPath,
			bibliography: bibliographyPath,
			supplements: supplementPaths = [],
			preambles: preamblePaths = [],
		} = {},
	} = directive;
	let hasDocument = sourceFiles.some((file) => file.label === 'document');
	let hasBibliography = sourceFiles.some((file) => file.label === 'bibliography');
	const labelledFiles = [];
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
				extractedPandocYamlString: extractedPandocYamlString,
			};
		}
	}
	return { document: document };
};

const createPandocMetadataFile = async (directive, extractedPandocYamlString) => {
	const { pandocMetadata } = directive;
	const yamlString = pandocMetadata ? YAML.stringify(pandocMetadata) : extractedPandocYamlString;
	if (yamlString) {
		const { path: tmpPath } = await tmp.file({ postfix: '.yaml' });
		await fs.writeFile(tmpPath, yamlString);
		return { tmpPath: tmpPath, label: 'metadata' };
	}
	return null;
};

const createPreambleFile = async (directive) => {
	const { preamble } = directive;
	if (preamble) {
		const { path: tmpPath } = await tmp.file();
		await fs.writeFile(tmpPath, preamble);
		return { tmpPath: tmpPath, label: 'preamble' };
	}
	return null;
};

const createPreambleFiles = async (directive, sourceFiles) => {
	const document = sourceFiles.find((sf) => sf.label === 'document');
	const notDocument = sourceFiles.filter((sf) => sf !== document);
	const {
		document: nextDocument,
		extractedPandocYamlString,
	} = await getDocumentAndMaybeYamlPreamble(document, directive);
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

const writeDocumentToPubDraft = async (pubId, document) => {
	const draftBranch = await Branch.findOne({ where: { pubId: pubId, title: 'draft' } });
	const branchRef = getBranchRef(pubId, draftBranch.id);
	const hydratedDocument = Node.fromJSON(documentSchema, document);
	const documentSlice = new Slice(Fragment.from(hydratedDocument.content), 0, 0);
	const replaceStep = new ReplaceStep(0, 0, documentSlice);
	const change = createFirebaseChange([replaceStep], draftBranch.id, 'bulk-importer');
	await branchRef
		.child('changes')
		.child(0)
		.set(change);
};

export const resolvePubDirective = async ({ directive, targetPath, community, collection }) => {
	const { importerFlags = {} } = directive;
	const sourceFiles = await getImportableFiles(directive, targetPath);
	const tmpDir = await tmp.dir();
	const { doc, warnings, proposedMetadata, rawMetadata } = await importFiles({
		tmpDirPath: tmpDir.path,
		sourceFiles: sourceFiles,
		importerFlags: importerFlags,
		provideRawMetadata: true,
	});

	const resolvedDirective = await resolveDirectiveValues(directive, sourceFiles, rawMetadata);

	const pub = await createPub({
		communityId: community.id,
		directive: resolvedDirective,
		proposedMetadata: proposedMetadata,
	});

	await createPubAttributions(pub, proposedMetadata, resolvedDirective);
	await writeDocumentToPubDraft(pub.id, doc);

	const createdTags = await createPubTags(resolvedDirective, pub.id, community.id);
	if (collection) {
		await createCollectionPub({ collectionId: collection.id, pubId: pub.id, isPrimary: true });
	}

	// eslint-disable-next-line no-console
	console.log('created Pub:', pub.title);
	return {
		pub: pub,
		collection: createdTags,
		warnings: warnings,
		created: true,
	};
};
