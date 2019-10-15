import { useState } from 'react';

import { s3Upload } from 'utils';

import { exclusiveFileLabels, labelFiles } from './formats';

let fileIdCounter = 0;

export const useFileManager = () => {
	const [files, setFiles] = useState([]);

	const updateFileById = (fileId, value) =>
		setFiles((currentFiles) => {
			const exists = currentFiles.some((file) => file.id === fileId);
			if (exists) {
				return labelFiles(
					currentFiles.map((file) => {
						if (file.id === fileId) {
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
						fileId === file.id
							? newLabel
							: label === newLabel && isExclusiveLabel
							? null
							: label;
					return { ...file, label: nextLabel };
				}),
			),
		);
	};

	const deleteFileById = (fileId) =>
		setFiles((currentFiles) => labelFiles(currentFiles.filter((file) => file.id !== fileId)));

	const onProgress = (fileId) => ({ loaded, total }) =>
		updateFileById(fileId, { state: 'uploading', loaded: loaded, total: total });

	const onComplete = (fileId) => (_, __, ___, url) =>
		updateFileById(fileId, { state: 'complete', url: url });

	const addFile = (file) => {
		const fileId = fileIdCounter;
		const localPath = file.path || file.name;
		fileIdCounter += 1;
		s3Upload(file, onProgress(fileId), onComplete(fileId));
		setFiles((currentFiles) => [
			...currentFiles,
			{ id: fileId, state: 'waiting', localPath: localPath },
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
