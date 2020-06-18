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

export const s3Upload = (file, progressEvent, finishEvent, index) => {
	function beginUpload() {
		const folderName = isProd() ? generateHash(8) : '_testing';

		const extension = file.name !== undefined ? file.name.split('.').pop() : 'jpg';

		// const filename = folderName + '/' + new Date().getTime() + '.' + extension;
		// const filename = folderName + '/' + (Math.floor(Math.random() * 8)) + new Date().getTime() + '.' + extension;
		const filename = `${folderName}/${Math.floor(
			Math.random() * 8,
		)}${new Date().getTime()}.${extension}`;
		const fileType = file.type !== undefined ? file.type : 'image/jpeg';
		const formData = new FormData();

		formData.append('key', filename);
		formData.append('AWSAccessKeyId', 'AKIAIUXFM6YJQGAV7GRQ');
		formData.append('acl', 'public-read');
		formData.append('policy', JSON.parse(this.responseText).policy);
		formData.append('signature', JSON.parse(this.responseText).signature);
		formData.append('Content-Type', fileType);
		formData.append('success_action_status', '200');
		formData.append('file', file);
		const sendFile = new XMLHttpRequest();
		sendFile.upload.addEventListener(
			'progress',
			(evt) => {
				progressEvent(evt, index);
			},
			false,
		);
		sendFile.upload.addEventListener(
			'load',
			(evt) => {
				checkForAsset(
					`https://s3-external-1.amazonaws.com/assets.pubpub.org/${filename}`,
				).then(() => {
					finishEvent(evt, index, file.type, filename, file.name);
				});
			},
			false,
		);
		sendFile.open('POST', 'https://s3-external-1.amazonaws.com/assets.pubpub.org', true);
		sendFile.send(formData);
	}

	const getPolicy = new XMLHttpRequest();
	getPolicy.addEventListener('load', beginUpload);
	getPolicy.open('GET', `/api/uploadPolicy?contentType=${file.type}`);
	getPolicy.send();
};
