import { useState } from 'react';

import { s3Upload } from 'client/utils/upload';

import { exclusiveFileLabels, labelFiles } from './formats';

let fileIdCounter = 0;

export const useFileManager = () => {
	const [files, setFiles] = useState([]);

	const updateFileById = (fileId, value) =>
		setFiles((currentFiles) => {
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'id' does not exist on type 'never'.
			const exists = currentFiles.some((file) => file.id === fileId);
			if (exists) {
				return labelFiles(
					currentFiles.map((file) => {
						// @ts-expect-error ts-migrate(2339) FIXME: Property 'id' does not exist on type 'never'.
						if (file.id === fileId) {
							// @ts-expect-error ts-migrate(2698) FIXME: Spread types may only be created from object types... Remove this comment to see the full error message
							return { ...file, ...value };
						}
						return file;
					}),
				);
			}
			return currentFiles;
		});

	const labelFileById = (fileId, newLabel) => {
		const isExclusiveLabel = exclusiveFileLabels.includes(newLabel);
		setFiles((currentFiles) =>
			labelFiles(
				currentFiles.map((file) => {
					const { label } = file;
					const nextLabel =
						// @ts-expect-error ts-migrate(2339) FIXME: Property 'id' does not exist on type 'never'.
						fileId === file.id
							? newLabel
							: label === newLabel && isExclusiveLabel
							? null
							: label;
					// @ts-expect-error ts-migrate(2698) FIXME: Spread types may only be created from object types... Remove this comment to see the full error message
					return { ...file, label: nextLabel };
				}),
			),
		);
	};

	const deleteFileById = (fileId) =>
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'id' does not exist on type 'never'.
		setFiles((currentFiles) => labelFiles(currentFiles.filter((file) => file.id !== fileId)));

	const onProgress = (fileId) => ({ loaded, total }) =>
		updateFileById(fileId, { state: 'uploading', loaded: loaded, total: total });

	const onComplete = (fileId) => (_, __, ___, assetKey) =>
		updateFileById(fileId, { state: 'complete', assetKey: assetKey });

	const addFile = (file) => {
		const fileId = fileIdCounter;
		const clientPath = file.path || file.name;
		fileIdCounter += 1;
		// @ts-expect-error ts-migrate(2554) FIXME: Expected 4 arguments, but got 3.
		s3Upload(file, onProgress(fileId), onComplete(fileId));
		// @ts-expect-error ts-migrate(2345) FIXME: Type '{ id: number; state: string; clientPath: any... Remove this comment to see the full error message
		setFiles((currentFiles) => [
			...currentFiles,
			{ id: fileId, state: 'waiting', clientPath: clientPath },
		]);
	};

	const getFiles = () => files;

	return {
		addFile: addFile,
		getFiles: getFiles,
		deleteFileById: deleteFileById,
		labelFileById: labelFileById,
	};
};
