const crypto = require('crypto');

const areInputFilesAvailable = (pubDir, inputFileNames) =>
	inputFileNames.every((name) => pubDir.exists(name));

const getHashOfFiles = (pubDir, inputFileNames) => {
	const resObj = {};
	inputFileNames.forEach((name) => {
		resObj[name] = pubDir.read(name);
	});
	return crypto
		.createHash('md5')
		.update(JSON.stringify(resObj))
		.digest('hex');
};

const createHashMatcher = (hashFilename, hashInputFiles) => {
	const matchHash = (pubDir) => {
		if (pubDir.exists(hashFilename) && areInputFilesAvailable(pubDir, hashInputFiles)) {
			const existingHash = pubDir.read(hashFilename).toString();
			const hashOfFiles = getHashOfFiles(pubDir, hashInputFiles);
			return existingHash === hashOfFiles;
		}
		return false;
	};

	const updateHash = (pubDir) => {
		if (areInputFilesAvailable(pubDir, hashInputFiles)) {
			const hash = getHashOfFiles(pubDir, hashInputFiles);
			pubDir.write(hashFilename, hash);
		}
	};

	return { matchHash: matchHash, updateHash: updateHash };
};

module.exports = { createHashMatcher: createHashMatcher };
