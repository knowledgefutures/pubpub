import fs from 'fs';
import AWS from 'aws-sdk';
import tmp from 'tmp-promise';

import { Export } from 'server/models';
import { generateHash } from 'utils/hashes';

tmp.setGracefulCleanup();

AWS.config.setPromisesDependency(Promise);
const s3bucket = new AWS.S3({ params: { Bucket: 'assets.pubpub.org' } });

export const uploadDocument = (branchId, tmpFile, extension) => {
	const readableStream = fs.createReadStream(tmpFile.path);
	const key = `${generateHash(8)}/${branchId}.${extension}`;
	const params = {
		Key: key,
		Body: readableStream,
		ACL: 'public-read',
	};
	return new Promise((resolve, reject) => {
		s3bucket.upload(params, (err) => {
			if (err) {
				reject(err);
			}
			resolve(`https://assets.pubpub.org/${key}`);
		});
	});
};

export const getTmpFileForExtension = (extension) => tmp.file({ postfix: `.${extension}` });

export const writeToFile = (html, file) => {
	return new Promise((resolve, reject) => {
		fs.writeFile(file.path, html, {}, (err, res) => {
			if (err) {
				return reject(err);
			}
			return resolve(res);
		});
	});
};

export const getExportById = (exportId) => Export.findOne({ where: { id: exportId } });

export const assignFileToExportById = (exportId, fileUrl) =>
	Export.update({ url: fileUrl }, { where: { id: exportId } });
