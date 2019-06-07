const fs = require('fs');
const path = require('path');

const storage = (workingDirectory) => {
	fs.mkdirSync(workingDirectory, { recursive: true });
	return {
		contents: () => fs.readdirSync(workingDirectory),
		readStream: (filePath, ...restArgs) =>
			fs.createReadStream(path.join(workingDirectory, filePath), ...restArgs),
		read: (filePath, ...restArgs) =>
			fs.readFileSync(path.join(workingDirectory, filePath), ...restArgs),
		write: (filePath, ...restArgs) =>
			fs.writeFileSync(path.join(workingDirectory, filePath), ...restArgs),
		within: (subdirectory, callback) => {
			const substorage = storage(path.join(workingDirectory, subdirectory));
			if (callback) {
				return callback(substorage);
			}
			return substorage;
		},
		exists: (filePath) => fs.existsSync(path.join(workingDirectory, filePath)),
		rm: (filePath) => {
			const rmPath = path.join(workingDirectory, filePath);
			if (fs.existsSync(rmPath)) {
				fs.unlinkSync(rmPath);
			}
		},
	};
};

module.exports = storage;
