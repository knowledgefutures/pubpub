/* eslint-disable no-restricted-syntax */
import path from 'path';

import { generateAssetKeyForFile, uploadFileToAssetStore, getUrlForAssetKey } from './assetStore';

const getSourceFileForResource = (resourcePath, sourceFiles, document) => {
	const possibleSourceFiles = sourceFiles.filter((file) => file.clientPath);
	// First, try to find a file in the uploads with the exact path
	for (const sourceFile of possibleSourceFiles) {
		if (resourcePath === sourceFile.clientPath) {
			return sourceFile;
		}
	}
	// Then, try to find a file in the uploads with the same relative path
	const documentContainer = path.dirname(document.clientPath);
	for (const sourceFile of possibleSourceFiles) {
		const relativePathWithExtension = path.relative(documentContainer, sourceFile.clientPath);
		const relativePathSansExtension = relativePathWithExtension
			.split('.')
			.slice(0, -1)
			.join('.');
		if (
			resourcePath === relativePathWithExtension ||
			resourcePath === relativePathSansExtension
		) {
			return sourceFile;
		}
	}
	// Having failed, just look for a source file with the same name as the requested file.
	const baseName = path.basename(resourcePath);
	for (const sourceFile of possibleSourceFiles) {
		if (path.basename(sourceFile.clientPath) === baseName) {
			return sourceFile;
		}
	}
	return null;
};

const uploadPendingSourceFile = async (sourceFile, newAssetKey) => {
	const { tmpPath } = sourceFile;
	if (tmpPath) {
		return uploadFileToAssetStore(tmpPath, newAssetKey);
	}
	throw new Error('Pending source file must have a tmpPath');
};

export const createResourceTransformer = ({ sourceFiles, document, bibliographyItems }) => {
	const warnings = [];
	const pendingUploadsMap = new Map();

	const getAssetKeyForLocalResource = (localResource) => {
		const sourceFile = getSourceFileForResource(localResource, sourceFiles, document);
		if (sourceFile) {
			if (sourceFile.assetKey) {
				return sourceFile.assetKey;
			}
			const newKey = generateAssetKeyForFile(sourceFile.clientPath);
			pendingUploadsMap.set(sourceFile, newKey);
			return newKey;
		}
		return null;
	};

	const getResource = (resource, context) => {
		if (context === 'citation') {
			const item = bibliographyItems[resource];
			if (item) {
				return item;
			}
			warnings.push({ type: 'missingCitation', id: resource });
			return { structuredValue: '', unstructuredValue: '' };
		}
		if (context === 'image') {
			const assetKey = getAssetKeyForLocalResource(resource);
			if (assetKey) {
				return getUrlForAssetKey(assetKey);
			}
			warnings.push({
				type: 'missingImage',
				path: resource,
				unableToFind: true,
			});
			return resource;
		}
		return resource;
	};

	const uploadPendingResources = () =>
		Promise.all(
			[...pendingUploadsMap.entries()].map(([sourceFile, newAssetKey]) =>
				uploadPendingSourceFile(sourceFile, newAssetKey).catch((error) =>
					warnings.push({
						type: 'missingImage',
						unableToUpload: true,
						error: error.message,
						sourceFile: sourceFile,
						path: sourceFile.tmpPath || sourceFile.remoteUrl,
					}),
				),
			),
		);

	return {
		getResource: getResource,
		getWarnings: () => warnings,
		uploadPendingResources: uploadPendingResources,
	};
};
