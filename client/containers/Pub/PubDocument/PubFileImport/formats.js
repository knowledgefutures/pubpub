import { extensionToPandocFormat, bibliographyFormats } from 'utils/import/formats';

export const exclusiveFileLabels = ['document', 'bibliography'];

export const extensionFor = (fileName) => {
	const pieces = fileName.split('.');
	return pieces[pieces.length - 1];
};

const fileIsValidDocument = (file) =>
	Object.keys(extensionToPandocFormat).includes(extensionFor(file.clientPath));

export const getPotentialLabelsForFile = (file) => {
	const isDoc = fileIsValidDocument(file);
	return [
		isDoc && 'document',
		isDoc && 'supplement',
		bibliographyFormats.includes(extensionFor(file.clientPath)) && 'bibliography',
	].filter((x) => x);
};

export const labelFiles = (files) => {
	const bibliography =
		files.find((file) => file.label === 'bibliography') ||
		files.find((file) => extensionFor(file.clientPath) === 'bib' && !file.label);
	const doc =
		files.find((file) => file.label === 'document') ||
		files.find((file) => fileIsValidDocument(file) && !file.label);
	return files.map((file) => {
		if (file === doc) {
			return { ...file, label: 'document' };
		}
		if (file === bibliography) {
			return { ...file, label: 'bibliography' };
		}
		return file;
	});
};
