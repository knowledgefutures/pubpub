import crypto from 'crypto';

export const getUploadPolicy = ({ contentType }) => {
	const acl = 'public-read';
	const bucket = 'assets.pubpub.org';
	const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
	const awsAccessKeySecret = process.env.AWS_SECRET_ACCESS_KEY;
	const expirationDate = new Date(Date.now() + 60000);

	const policyObject = {
		expiration: expirationDate,
		conditions: [
			{ bucket: bucket },
			['starts-with', '$key', ''],
			{ acl: acl },
			{ success_action_status: '200' },
			['starts-with', '$Content-Type', contentType],
		],
	};

	const policy = Buffer.from(JSON.stringify(policyObject))
		.toString('base64')
		.replace(/\n|\r/, '');

	const hmac = crypto.createHmac('sha1', awsAccessKeySecret);
	hmac.update(policy);
	const signature = hmac.digest('base64');

	return {
		acl: acl,
		awsAccessKeyId: awsAccessKeyId,
		policy: policy,
		signature: signature,
		bucket: bucket,
	};
};
