/* eslint-disable no-console */
import fs from 'fs';
// import request from 'request';
import Promise from 'bluebird';
import nodePandoc from 'node-pandoc';
import tmp from 'tmp-promise';
import AWS from 'aws-sdk';
import cheerio from 'cheerio';
import { generateHash } from '../server/utilities';

const isPubPubProduction = !!process.env.PUBPUB_PRODUCTION;

AWS.config.setPromisesDependency(Promise);
const s3bucket = new AWS.S3({ params: { Bucket: 'assets.pubpub.org' } });

// Need to check for media folder - and upload all assets there to server, and then replace urls
// Send HTML to editor, which converts to json
// And then editor (I think) writes to firebase
// - get file, enter into pandoc, get html, convert into pubpub json

tmp.setGracefulCleanup();
const dataDir = process.env.NODE_ENV === 'production'
	? '--data-dir=/app/.apt/usr/share/pandoc/data '
	: '';


const processImages = (inputHtml)=> {
	/* Images are blocks and cannot be nested inside <p> or other tags. */
	/* This moves the image to just before it's containing paragraph. */
	const htmlContext = cheerio.load(inputHtml);
	htmlContext('img').each((index, elem)=> {
		return htmlContext(elem).parent().before(elem);
	});
	return htmlContext('body').html();
};

const processFootnotes = (inputHtml)=> {
	const htmlContext = cheerio.load(inputHtml);
	const footnoteContents = [];
	htmlContext('section.footnotes').find('li').each((index, elem)=> {
		htmlContext(elem).contents().find('a.footnote-back').remove();
		footnoteContents.push(htmlContext(elem).contents().html());
	});
	htmlContext('a.footnote-ref').each((index, elem)=> {
		htmlContext(elem).replaceWith(`<footnote data-value="${footnoteContents[index]}"></footnote>`);
	});
	htmlContext('section.footnotes').remove();
	return htmlContext('body').html();
};

export default (sourceUrl)=> {
	console.log('Got an import task for ', sourceUrl);
	const extension = sourceUrl.split('.').pop().toLowerCase();
	const extensionTypes = {
		docx: { format: 'docx' },
		epub: { format: 'epub' },
		html: { format: 'html' },
		md: { format: 'markdown_strict' },
		odt: { format: 'odt' },
		txt: { format: 'plain' },
		xml: { format: 'jats' },
		tex: { format: 'latex' },
	};

	return tmp.file({ postfix: `.${extension}` })
	.then((tmpFile)=> {
		const streamToTmpFile = new Promise((resolve, reject)=> {
			const writeStream = fs.createWriteStream(tmpFile.path);
			s3bucket.getObject({ Key: sourceUrl.replace('https://assets.pubpub.org/', '') })
			.createReadStream()
			.on('end', () => { return resolve(tmpFile.path); })
			.on('error', (error) => { return reject(error); })
			.pipe(writeStream);
		});
		const tmpDir = tmp.dir().then((dir)=> {
			return dir.path;
		});

		return Promise.all([streamToTmpFile, tmpDir]);
	})
	.then(([tmpFile, tmpDir])=> {
		console.log('About to start pandoc');
		const extractMedia = extension === 'html'
			? ''
			: ` --extract-media=${tmpDir}`;
		const args = `${dataDir}-f ${extensionTypes[extension].format} -t html${extractMedia}`;
		return new Promise((resolve, reject)=> {
			nodePandoc(tmpFile, args, (err, result)=> {
				console.warn(err);
				if (err && err.message) {
					console.warn(err.message);
				}
				/* This callback is called multiple times */
				/* err is sent multiple times and includes warnings */
				/* So to check if the file generated, check the size */
				/* of the tmp file. */
				if (result && !err) {
					resolve([tmpDir, result]);
				}
				if (result && err) {
					reject(new Error('Error in Pandoc'));
				}
			});
		});
	})
	.then(([tmpDir, convertedHtml])=> {
		/* Upload any local media to assets.pubpub */
		const fileUploads = [];
		const localFilePaths = [];
		const extractedMediaFiles = [];
		if (fs.existsSync(`${tmpDir}`)) {
			fs.readdirSync(`${tmpDir}`).forEach(file => {
				if (!fs.lstatSync(`${tmpDir}/${file}`).isDirectory()) {
					extractedMediaFiles.push(`${tmpDir}/${file}`);
				}
			});
		}
		if (fs.existsSync(`${tmpDir}/media`)) {
			fs.readdirSync(`${tmpDir}/media`).forEach(file => {
				extractedMediaFiles.push(`${tmpDir}/media/${file}`);
			});
		}

		extractedMediaFiles.forEach((localFilePath)=> {
			const folderName = isPubPubProduction
				? generateHash(8)
				: '_testing';

			const fileExtension = localFilePath.split('.').pop().toLowerCase();
			localFilePaths.push(localFilePath);

			const key = `${folderName}/${Math.floor(Math.random() * 8)}${new Date().getTime()}.${fileExtension}`;
			const params = {
				Key: key,
				Body: fs.createReadStream(localFilePath),
				ACL: 'public-read',
			};
			fileUploads.push(new Promise((resolve, reject)=> {
				s3bucket.upload(params, (err)=> {
					if (err) { reject(err); }
					resolve(`https://assets.pubpub.org/${key}`);
				});
			}));
		});
		return Promise.all([convertedHtml, localFilePaths, ...fileUploads]);
	})
	.then((htmlAndPaths)=> {
		/* Replace asset URLs with assets.pubpub URL */
		let convertedHtml = htmlAndPaths[0];
		const localFilePaths = htmlAndPaths[1];
		const fileUploadPaths = htmlAndPaths.slice(2);
		localFilePaths.forEach((localFilePath, index)=> {
			const re = new RegExp(localFilePath, 'g');
			convertedHtml = convertedHtml.replace(re, fileUploadPaths[index]);
		});

		if (convertedHtml === true) { return { html: 'Error parsing file' }; }

		/* Remove images from wrapped p-tags */
		let cleanedConvertedHtml = processImages(convertedHtml);
		// convertedHtml.replace(/<p>\s*(<a .*>)?\s*(<img .* \/>)\s*(<\/a>)?\s*<\/p>/gi, '$1$2$3');
		cleanedConvertedHtml = processFootnotes(cleanedConvertedHtml);

		// TODO:
		// footnotes
		// citations

		return { html: cleanedConvertedHtml };
	});
};
