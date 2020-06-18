import path from 'path';
import fs from 'fs';
import nodePandoc from 'node-pandoc';
import YAML from 'yaml';

import { getLicenseBySlug } from 'utils/licenses';
import { getTmpFileForExtension } from './util';

const getTemplatePath = (pandocTarget) => {
	return path.join(__dirname, 'templates', `default.${pandocTarget}`);
};

const createPandocArgs = (pandocTarget, tmpFile, metadataFile) => {
	// pandoc inexplicably does not include a default template for docx or odt
	const template = pandocTarget !== 'docx' && pandocTarget !== 'odt';
	return [
		['-f', 'html'],
		['-t', pandocTarget],
		['-o', tmpFile.path],
		template && [`--template=${getTemplatePath(pandocTarget)}`],
		metadataFile && [`--metadata-file=${metadataFile.path}`],
	]
		.filter((x) => x)
		.reduce((acc, next) => [...acc, ...next], []);
};

const createYamlMetadataFile = async (
	{
		attributions,
		publishedDateString,
		licenseSlug,
		primaryCollectionMetadata,
		communityTitle,
		doi,
	},
	pandocTarget,
) => {
	const license = getLicenseBySlug(licenseSlug);
	const formattedAttributions = attributions.map((attr) => {
		if (pandocTarget === 'jats_archiving') {
			return {
				...(attr.user.lastName && { surname: attr.user.lastName }),
				...(attr.user.firstName && { 'given-names': attr.user.firstName }),
				...(attr.user.publicEmail && { email: attr.user.publicEmail }),
				...(attr.user.orcid && { orcid: attr.user.orcid }),
			};
		}
		return attr.user.fullName;
	});
	const metadata = YAML.stringify({
		author: formattedAttributions,
		...(publishedDateString && { date: publishedDateString }),
		journal: {
			title: communityTitle,
		},
		copyright: {
			text: license.full,
			type: license.short,
			...(license.link && { link: license.link }),
		},
		...(primaryCollectionMetadata && {
			article: {
				...(primaryCollectionMetadata.issue && { issue: primaryCollectionMetadata.issue }),
				...(primaryCollectionMetadata.volume && {
					volume: primaryCollectionMetadata.volume,
				}),
				...(doi && { doi: doi }),
			},
		}),
	});
	const file = await getTmpFileForExtension('yaml');
	fs.writeFileSync(file.path, metadata);
	return file;
};

export const callPandoc = async ({ staticHtml, pandocTarget, pubMetadata, tmpFile }) => {
	const metadataFile = await createYamlMetadataFile(pubMetadata, pandocTarget);
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
