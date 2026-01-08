import type { PageContext } from 'types';

import { isProd } from 'utils/environment';

declare global {
	interface Window {
		__pubpub_pageContextProps__?: PageContext;
	}
}

const getUploadContext = () => {
	if (typeof window === 'undefined') {
		return { communityId: 'unknown', userId: 'unknown', pubId: undefined };
	}

	const ctx = window.__pubpub_pageContextProps__;
	if (!ctx) {
		return { communityId: 'unknown', userId: 'unknown', pubId: undefined };
	}

	const communityId = ctx.communityData?.id ?? 'unknown';
	const userId = ctx.loginData?.id ?? 'anonymous';
	const pubId = ctx.scopeData?.elements?.activeIds?.pubId ?? undefined;

	return { communityId, userId, pubId };
};

const checkForAsset = (url): Promise<void> => {
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
	const testPrefix = isProd() ? '' : '_testing/';

	const { communityId, userId, pubId } = getUploadContext();
	const [rawFileName = 'unknown', fileExtension = 'jpg'] =
		file.name?.split(/(.*)\.(.*)/).filter(Boolean) ?? [];
	const fileName = rawFileName.replace(/\s+/g, '_');
	const random = Math.floor(Math.random() * 8);
	const now = new Date().getTime();
	const pubSegment = pubId ? `/p${pubId}` : '';
	return `${testPrefix}c${communityId}${pubSegment}/u${userId}/${fileName}-${random}${now}.${fileExtension}`;
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
	getPolicy.open('GET', `/api/uploadPolicy?contentType=${encodeURIComponent(file.type)}`);
	getPolicy.send();
};
