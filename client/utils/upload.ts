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
			})
				.then((response) => {
					if (!response.ok) {
						if (checkCount < maxCheckCount) {
							checkCount += 1;
							return setTimeout(checkUrl, checkInterval);
						}
						return reject(
							new Error(`Uploaded file could not be verified (status ${response.status})`),
						);
					}
					return resolve();
				})
				.catch((err) => {
					if (checkCount < maxCheckCount) {
						checkCount += 1;
						return setTimeout(checkUrl, checkInterval);
					}
					return reject(err);
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
	// Replace whitespace and any character that isn't URL/S3-key safe (e.g. `#`, `?`,
	// `%`, `&`) with an underscore. Such characters otherwise end up in the S3 key and
	// break both the upload verification (`#` is parsed as a URL fragment, so the HEAD
	// check hits the wrong object and S3 returns a 403) and the eventual download URL.
	const fileName = rawFileName.replace(/[^a-zA-Z0-9\-_.]+/g, '_');
	const random = Math.floor(Math.random() * 8);
	const now = new Date().getTime();
	const pubSegment = pubId ? `/p${pubId}` : '';
	return `${testPrefix}c${communityId}${pubSegment}/u${userId}/${fileName}-${random}${now}.${fileExtension}`;
};

import { MAX_UPLOAD_SIZE_BYTES } from 'utils/uploadConsts';

const getBaseUrlForBucket = (bucket) => `https://s3-external-1.amazonaws.com/${bucket}`;

const defaultOnError = (err: Error) => {
	// biome-ignore lint/suspicious/noAlert: simplest feedback for a non-React utility
	alert(`Upload failed: ${err.message}`);
};

export const s3Upload = (
	file: File,
	onProgress,
	onFinish,
	index?: number,
	onError: (err: Error) => void = defaultOnError,
) => {
	if (file.size > MAX_UPLOAD_SIZE_BYTES) {
		const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
		onError(
			new Error(
				`File "${file.name}" is ${sizeMB} MB, which exceeds the 100 MB upload limit.`,
			),
		);
		return;
	}
	const fileName = getFileNameForUpload(file);
	const fileType = file.type !== undefined ? file.type : 'image/jpeg';
	function beginUpload(this: any) {
		if (this.status < 200 || this.status >= 300) {
			onError(new Error(`Could not get an upload policy (status ${this.status})`));
			return;
		}
		const { policy, signature, acl, awsAccessKeyId, bucket } = JSON.parse(this.responseText);
		const formData = new FormData();
		formData.append('key', fileName);
		formData.append('AWSAccessKeyId', awsAccessKeyId);
		formData.append('acl', acl);
		formData.append('policy', policy);
		formData.append('signature', signature);
		formData.append('Content-Type', fileType);
		if (fileType === 'text/html') {
			formData.append('Content-Disposition', 'attachment; filename="' + file.name + '"');
		}
		formData.append('success_action_status', '200');
		formData.append('file', file);
		const sendFile = new XMLHttpRequest();
		const baseUrl = getBaseUrlForBucket(bucket);
		sendFile.upload.addEventListener('progress', (evt) => onProgress(evt, index), false);
		// Listen on the request (not `sendFile.upload`) so we can inspect S3's response
		// status. A rejected upload (e.g. a 403 for a malformed key) still fires the
		// upload `load` event, so checking the response status here is what lets us
		// surface the failure instead of spinning forever.
		sendFile.addEventListener(
			'load',
			(evt) => {
				if (sendFile.status < 200 || sendFile.status >= 300) {
					onError(new Error(`Upload was rejected by the server (status ${sendFile.status})`));
					return;
				}
				checkForAsset(`${baseUrl}/${fileName}`).then(
					() => onFinish(evt, index, file.type, fileName, file.name),
					(err) => onError(err instanceof Error ? err : new Error('Upload verification failed')),
				);
			},
			false,
		);
		sendFile.addEventListener('error', () => onError(new Error('Network error during upload')), false);
		sendFile.addEventListener('abort', () => onError(new Error('Upload was aborted')), false);
		sendFile.open('POST', baseUrl, true);
		sendFile.send(formData);
	}
	const getPolicy = new XMLHttpRequest();
	getPolicy.addEventListener('load', beginUpload);
	getPolicy.addEventListener(
		'error',
		() => onError(new Error('Network error while requesting upload policy')),
		false,
	);
	const policyParams = new URLSearchParams({
		contentType: file.type,
	});
	if (file.name) policyParams.set('filename', file.name);
	policyParams.set('key', fileName);
	getPolicy.open('GET', `/api/uploadPolicy?${policyParams.toString()}`);
	getPolicy.send();
};
