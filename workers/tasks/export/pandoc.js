import fs from 'fs';
import nodePandoc from 'node-pandoc';
import YAML from 'yaml';

import { getTmpFileForExtension } from './util';

const dataRoot = process.env.NODE_ENV === 'production' ? '/app/.apt/usr/share/pandoc/data ' : '';

const createPandocArgs = (pandocTarget, tmpFile, metadataFile) => {
	return [
		dataRoot && [`--data-dir=${dataRoot}`],
		['-f', 'html'],
		['-t', pandocTarget],
		['-o', tmpFile.path],
		metadataFile && [`--metadata-file=${metadataFile.path}`],
	]
		.filter((x) => x)
		.reduce((acc, next) => [...acc, ...next], []);
};

const createYamlMetadataFile = async ({ attributions, publishedDateString }) => {
	const metadata = YAML.stringify({
		author: attributions,
		...(publishedDateString && { date: publishedDateString }),
	});
	const file = await getTmpFileForExtension('yaml');
	fs.writeFileSync(file.path, metadata);
	return file;
};

export const callPandoc = async ({ staticHtml, pandocTarget, pubMetadata, tmpFile }) => {
	const metadataFile = await createYamlMetadataFile(pubMetadata);
	const args = createPandocArgs(pandocTarget, tmpFile, metadataFile);
	return new Promise((resolve, reject) => {
		nodePandoc(staticHtml, args, (err, result) => {
			if (err && err.message) {
				console.warn(err.message);
			}
			/* This callback is called multiple times */
			/* err is sent multiple times and includes warnings */
			/* So to check if the file generated, check the size */
			/* of the tmp file. */
			const wroteToFile = !!fs.statSync(tmpFile.path).size;
			if (result && wroteToFile) {
				resolve(result);
			}
			if (result && !wroteToFile) {
				reject(new Error('Error in Pandoc'));
			}
		});
	});
};
