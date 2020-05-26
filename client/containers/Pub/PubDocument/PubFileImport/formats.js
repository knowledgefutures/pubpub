export const extensionToPandocFormat = {
	docx: 'docx',
	epub: 'epub',
	html: 'html',
	md: 'markdown_strict',
	odt: 'odt',
	txt: 'markdown_strict',
	xml: 'jats',
	tex: 'latex',
};

export const bibliographyFormats = [
	'bib',
	'bibtex',
	'copac',
	'json',
	'yaml',
	'enl',
	'xml',
	'wos',
	'medline',
	'mods',
	'nbib',
	'ris',
];

export const exclusiveFileLabels = ['document', 'bibliography'];

const extensionOf = (fileName) => {
	const pieces = fileName.split('.');
	return pieces[pieces.length - 1];
};

const fileIsValidDocument = (file) =>
	Object.keys(extensionToPandocFormat).includes(extensionOf(file.localPath));

export const getPotentialLabelsForFile = (file) => {
	const isDoc = fileIsValidDocument(file);
	return [
		isDoc && 'document',
		isDoc && 'supplement',
		bibliographyFormats.includes(extensionOf(file.localPath)) && 'bibliography',
	].filter((x) => x);
};

export const labelFiles = (files) => {
	const bibliography =
		files.find((file) => file.label === 'bibliography') ||
		files.find((file) => extensionOf(file.localPath) === 'bib' && !file.label);
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
