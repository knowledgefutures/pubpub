import path from 'path';
import { exec } from 'child_process';
import { getTmpFileForExtension, writeToFile } from './util';

export const callPaged = async (staticHtml, tmpFile, collectSubprocess) => {
	const tmpHtmlFile = await getTmpFileForExtension('html');
	await writeToFile(staticHtml, tmpHtmlFile);
	return new Promise((resolve, reject) => {
		// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string | undefined' is not assig... Remove this comment to see the full error message
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
