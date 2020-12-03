import fs from 'fs';
import tmp from 'tmp-promise';

export const getTmpDirectoryPath = async () => {
	const tmpDirPossiblySymlinked = await tmp.dir();
	const tmpDir = fs.opendirSync(fs.realpathSync(tmpDirPossiblySymlinked.path));
	return tmpDir.path;
};
