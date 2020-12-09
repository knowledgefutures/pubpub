import tmp from 'tmp-promise';

import { extensionFor, spawn } from './util';

export const convertFileTypeIfNecessary = async (tmpFilePath) => {
	const extension = extensionFor(tmpFilePath);
	if (extension === 'pdf') {
		// Convert with pdftoppm
		const { path: pngPath } = await tmp.file({ postfix: '.png' });
		// pdftoppm tacks the extension onto the output file name. Whatever.
		const pathWithoutExtension = pngPath.slice(0, -4);
		await spawn('pdftoppm', [
			tmpFilePath,
			pathWithoutExtension,
			'-png',
			'-singlefile',
			'-rx',
			'300',
			'-ry',
			'300',
		]);
		return pngPath;
	}
	if (extension === 'tiff' || extension === 'tif') {
		const { path: pngPath } = await tmp.file({ postfix: '.png' });
		await spawn('convert', [tmpFilePath, pngPath]);
		return pngPath;
	}
	return tmpFilePath;
};
