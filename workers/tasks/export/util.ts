import fs from 'fs';
import tmp from 'tmp-promise';
import crypto from 'crypto';

import { Export } from 'server/models';
import { assetsClient } from 'server/utils/s3';
import { generateHash } from 'utils/hashes';
import { AttributionWithUser } from 'types';

tmp.setGracefulCleanup();

export const uploadDocument = async (pubId, tmpFile, extension) => {
	const readableStream = fs.createReadStream(tmpFile.path);
	const key = `${generateHash(8)}/${pubId}.${extension}`;
	const { url } = await assetsClient.uploadFile(key, readableStream);
	return url;
};

export const getTmpFileForExtension = (extension) => tmp.file({ postfix: `.${extension}` });

export const writeToFile = (html, file) => {
	return new Promise((resolve, reject) => {
		// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '(err: any, res: any) => void' is... Remove this comment to see the full error message
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

export const digestCitation = (unstructuredValue, structuredValue) =>
	crypto
		.createHash('md5')
		.update(unstructuredValue)
		.update(structuredValue)
		.digest('base64')
		.substring(0, 10);

export const getAffiliations = (attribution: AttributionWithUser) =>
	!attribution?.affiliation?.length
		? []
		: attribution.affiliation
				.split(';')
				.map((x) => x.trim())
				.filter(Boolean);

export const getDedupedAffliations = (attributions: AttributionWithUser[]) => {
	const affiliations = [
		...new Set(
			attributions
				.reduce((all, attr) => all.concat(getAffiliations(attr)), [] as string[])
				.filter(Boolean),
		),
	];
	return affiliations;
};
