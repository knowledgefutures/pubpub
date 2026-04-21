import crypto from 'crypto';

import { env } from 'server/env';
import { MAX_UPLOAD_SIZE_BYTES } from 'utils/upload';

type GetUploadPolicyParams = {
	contentType: string;
	filename?: string;
	key?: string;
};

export const getUploadPolicy = ({ contentType }: GetUploadPolicyParams) => {
	const acl = 'public-read';
	const bucket = 'assets.pubpub.org';
	const awsAccessKeyId = env.AWS_ACCESS_KEY_ID;
	const awsAccessKeySecret = env.AWS_SECRET_ACCESS_KEY;
	const expirationDate = new Date(Date.now() + 60000);

	const policyObject = {
		expiration: expirationDate,
		conditions: [
			{ bucket },
			['starts-with', '$key', ''],
			{ acl },
			{ success_action_status: '200' },
			['starts-with', '$Content-Type', contentType],
			['content-length-range', 0, MAX_UPLOAD_SIZE_BYTES],
			...(contentType === 'text/html'
				? [['starts-with', '$Content-Disposition', 'attachment; filename="']]
				: []),
		],
	};

	const policy = Buffer.from(JSON.stringify(policyObject))
		.toString('base64')
		.replace(/\n|\r/, '');

	const hmac = crypto.createHmac('sha1', awsAccessKeySecret);
	hmac.update(policy);
	const signature = hmac.digest('base64');

	return {
		acl,
		awsAccessKeyId,
		policy,
		signature,
		bucket,
	};
};
