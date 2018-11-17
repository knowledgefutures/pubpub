/* eslint-disable no-template-curly-in-string */
import crypto from 'crypto';
import app from '../server';

const awsDetails = {
	accessKeyAws: process.env.AWS_ACCESS_KEY_ID,
	secretKeyAws: process.env.AWS_SECRET_ACCESS_KEY,
};

app.get('/api/uploadPolicy', (req, res)=> {
	const s3 = {
		access_key: awsDetails.accessKeyAws,
		secret_key: awsDetails.secretKeyAws,
		bucket: 'assets.pubpub.org',
		acl: 'public-read',
		https: 'true',
		error_message: '',
		expiration_date: function() {
			return new Date(Date.now() + 60000);
		}
	};

	const bucket = s3.bucket; // the name you've chosen for the bucket
	const key = '/${filename}'; // the folder and adress where the file will be uploaded; ${filename} will be replaced by original file name (the folder needs to be public on S3!)
	const successActionRedirect = 'http://localhost:3000/upload/success'; // URL that you will be redirected to when the file will be successfully uploaded
	const contentType = req.query.contentType; // limit accepted content types; empty will disable the filter; for example: 'image/', 'image/png'
	const acl = s3.acl; // private or public-read

	// THIS YOU DON'T
	let policy = { expiration: s3.expiration_date(),
		conditions: [
			{ bucket: bucket },
			['starts-with', '$key', ''],
			{ acl: acl },
			{ success_action_status: '200' },
			['starts-with', '$Content-Type', ''],
		]
	};
	policy = Buffer.from(JSON.stringify(policy)).toString('base64').replace(/\n|\r/, '');
	const hmac = crypto.createHmac('sha1', s3.secret_key);
	hmac.update(policy);
	const signature = hmac.digest('base64');

	res.status(200).json({
		bucket: bucket,
		aws_key: s3.access_key,
		acl: acl,
		key: key,
		redirect: successActionRedirect,
		content_type: contentType,
		policy: policy,
		signature: signature
	});
});
