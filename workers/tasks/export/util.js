import fs from 'fs';
import AWS from 'aws-sdk';
import tmp from 'tmp-promise';

import { generateHash } from '../../../server/utils';

const formatTypes = {
	html: { extension: 'html' },
	pdf: { extension: 'pdf', pagedTarget: true },
	docx: { pandocTarget: 'docx', extension: 'docx' },
	epub: { pandocTarget: 'epub', extension: 'epub' },
	markdown: { pandocTarget: 'markdown_strict', extension: 'md' },
	odt: { pandocTarget: 'odt', extension: 'odt' },
	plain: { pandocTarget: 'plain', extension: 'txt' },
	jats: { pandocTarget: 'jats', extension: 'xml' },
	tex: { pandocTarget: 'latex', extension: 'tex' },
};

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
			resolve({ url: `https://assets.pubpub.org/${key}` });
		});
	});
};

export const getTmpFileForExtension = (extension) => tmp.file({ postfix: `.${extension}` });

export const getFormatDetails = (key) => formatTypes[key];

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
