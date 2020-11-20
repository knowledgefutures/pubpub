import { isProd } from 'utils/environment';
import { generateHash } from 'utils/hashes';

const checkForAsset = (url) => {
	let checkCount = 0;
	const maxCheckCount = 10;
	const checkInterval = 1000; /* This will check for 10 seconds and then fail */
	return new Promise((resolve, reject) => {
		const checkUrl = () => {
			fetch(url, {
				method: 'HEAD',
			}).then((response) => {
				if (!response.ok) {
					if (checkCount < maxCheckCount) {
						checkCount += 1;
						return setTimeout(checkUrl, checkInterval);
					}
					return reject();
				}
				return resolve();
			});
		};
		checkUrl();
	});
};

const getFileNameForUpload = (file: File) => {
	const folderName = isProd() ? generateHash(8) : '_testing';
	const extension = file.name !== undefined ? file.name.split('.').pop() : 'jpg';
	const random = Math.floor(Math.random() * 8);
	const now = new Date().getTime();
	return `${folderName}/${random}${now}.${extension}`;
};

const getBaseUrlForBucket = (bucket) => `https://s3-external-1.amazonaws.com/${bucket}`;

export const s3Upload = (file: File, onProgress, onFinish, index?: number) => {
	const fileName = getFileNameForUpload(file);
	const fileType = file.type !== undefined ? file.type : 'image/jpeg';
	function beginUpload(this: any) {
		const { policy, signature, acl, awsAccessKeyId, bucket } = JSON.parse(this.responseText);
		const formData = new FormData();
		formData.append('key', fileName);
		formData.append('AWSAccessKeyId', awsAccessKeyId);
		formData.append('acl', acl);
		formData.append('policy', policy);
		formData.append('signature', signature);
		formData.append('Content-Type', fileType);
		formData.append('success_action_status', '200');
		formData.append('file', file);
		const sendFile = new XMLHttpRequest();
		const baseUrl = getBaseUrlForBucket(bucket);
		sendFile.upload.addEventListener('progress', (evt) => onProgress(evt, index), false);
		sendFile.upload.addEventListener(
			'load',
			(evt) =>
				checkForAsset(`${baseUrl}/${fileName}`).then(() =>
					onFinish(evt, index, file.type, fileName, file.name),
				),
			false,
		);
		sendFile.open('POST', baseUrl, true);
		sendFile.send(formData);
	}
	const getPolicy = new XMLHttpRequest();
	getPolicy.addEventListener('load', beginUpload);
	getPolicy.open('GET', `/api/uploadPolicy?contentType=${file.type}`);
	getPolicy.send();
};
