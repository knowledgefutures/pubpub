import fs from 'fs';
import path from 'path';

export const loadDocAndStepsFromDir = (dirName) => {
	const pathToFiles = path.join(__dirname, '..', 'data', dirName);
	const read = (name) => JSON.parse(fs.readFileSync(path.join(pathToFiles, name)));
	return {
		branch: read('branch.json'),
		doc: read('doc.json'),
	};
};
