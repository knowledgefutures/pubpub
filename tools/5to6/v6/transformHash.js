const md5 = require('md5');

const matchTransformHash = (pubDir) => {
	if (pubDir.exists('transformUploadedHash') && pubDir.exists('transformed.json')) {
		const hash = pubDir.read('transformUploadedHash').toString();
		const transformedBody = pubDir.read('transformed.json');
		return hash === md5(transformedBody);
	}
	return false;
};

const updateTransformHash = (pubDir) => {
	if (pubDir.exists('transformed.json')) {
		const transformedBody = pubDir.read('transformed.json');
		const hash = md5(transformedBody).toString();
		pubDir.write('transformUploadedHash', hash);
	}
};

module.exports = {
	matchTransformHash: matchTransformHash,
	updateTransformHash: updateTransformHash,
};
