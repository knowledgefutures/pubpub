import path from 'path';
import { exec } from 'child_process';
import { getTmpFileForExtension, writeToFile } from './util';

export const callPaged = async (staticHtml, tmpFile, collectSubprocess) => {
	const tmpHtmlFile = await getTmpFileForExtension('html');
	await writeToFile(staticHtml, tmpHtmlFile);
	return new Promise((resolve, reject) => {
		const executable = path.join(process.env.PWD, 'node_modules', '.bin', 'pagedjs-cli');
		collectSubprocess(
			exec(`${executable} ${tmpHtmlFile.path} -b -o ${tmpFile.path} --noSandbox`, (err) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			}),
		);
	});
};
