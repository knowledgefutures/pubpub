import crypto from 'crypto';

import { expect } from 'utils/assert';

type GetUploadPolicyParams = {
	contentType: string;
	filename?: string;
	key?: string;
};

export const getUploadPolicy = ({ contentType }: GetUploadPolicyParams) => {
	const acl = 'public-read';
	const bucket = 'assets.pubpub.org';
	const awsAccessKeyId = expect(process.env.AWS_ACCESS_KEY_ID);
	const awsAccessKeySecret = process.env.AWS_SECRET_ACCESS_KEY;
	const expirationDate = new Date(Date.now() + 60000);

	const policyObject = {
		expiration: expirationDate,
		conditions: [
			{ bucket },
			['starts-with', '$key', ''],
			{ acl },
			{ success_action_status: '200' },
			['starts-with', '$Content-Type', contentType],
			...(contentType === 'text/html'
				? [['starts-with', '$Content-Disposition', 'attachment; filename="']]
				: []),
		],
	};

	const policy = Buffer.from(JSON.stringify(policyObject))
		.toString('base64')
		.replace(/\n|\r/, '');

	// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string | undefined' is not assig... Remove this comment to see the full error message
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
