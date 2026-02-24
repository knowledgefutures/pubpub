import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import * as Sentry from '@sentry/node';
import { execSync } from 'child_process';
import { createReadStream, statSync, unlinkSync } from 'fs';

import { postToSlack } from 'server/utils/slack';

const log = (msg: string) => console.log(`[backup] ${new Date().toISOString()} ${msg}`);

const postToSlackAboutSuccess = async (filename: string, sizeMB: string) => {
	const text = `DB backup completed: \`${filename}\` _(${sizeMB} MB)_`;
	await postToSlack({ text, icon_emoji: ':floppy_disk:' });
};

const pickRandomErrorEmoji = () => {
	const errorEmojis = ['larry', 'this-is-fine', 'facepalm', 'scream2'];
	const index = Math.floor(Math.random() * errorEmojis.length);
	return `:${errorEmojis[index]}:`;
};

const postToSlackAboutError = async (error: Error) => {
	const text = 'There was a problem creating the DB backup:\n```\n' + error.stack! + '\n```';
	await postToSlack({ text, icon_emoji: pickRandomErrorEmoji() });
};

const required = (name: string): string => {
	const val = process.env[name];
	if (!val) throw new Error(`Missing required env var: ${name}`);
	return val;
};

const DATABASE_URL = required('DATABASE_URL');
const BUCKET = process.env.S3_BACKUP_BUCKET;
const KEY_PREFIX = process.env.S3_BACKUP_KEY_PREFIX ?? 'pg-backups';

/* Auto-purge configured with one-time CLI script:
-------------------------

export AWS_ACCESS_KEY_ID=<key>
export AWS_SECRET_ACCESS_KEY=<key>

aws s3api put-bucket-lifecycle-configuration \
  --bucket pubpub-prod \
  --endpoint-url https://hel1.your-objectstorage.com \
  --lifecycle-configuration '{
    "Rules": [{
      "ID": "expire-old-backups",
      "Filter": {"Prefix": "pg-backups/"},
      "Status": "Enabled",
      "Expiration": {"Days": 14}
    }]
  }'
*/

async function main() {
	const s3 = new S3Client({
		region: 'eu-central',
		endpoint: required('S3_BACKUP_ENDPOINT'),
		credentials: {
			accessKeyId: required('S3_BACKUP_ACCESS_KEY'),
			secretAccessKey: required('S3_BACKUP_SECRET_KEY'),
		},
		forcePathStyle: true,
	});

	const timestamp = new Date().toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z';
	const dbName = new URL(DATABASE_URL).pathname.slice(1) || 'appdb';
	const filename = `${dbName}-${timestamp}.dump`;
	const localPath = `/tmp/${filename}`;
	const s3Key = `${KEY_PREFIX}/${filename}`;

	try {
		// 1. Dump
		log(`Dumping ${dbName} ...`);
		execSync(`pg_dump "${DATABASE_URL}" -Fc --no-owner --no-acl -f ${localPath}`, {
			stdio: 'inherit',
		});

		const size = statSync(localPath).size;
		const sizeMB = (size / 1024 / 1024).toFixed(1);
		log(`Dump complete: ${filename} (${sizeMB} MB)`);

		// 2. Upload
		log(`Uploading to s3://${BUCKET}/${s3Key} ...`);
		await s3.send(
			new PutObjectCommand({
				Bucket: BUCKET,
				Key: s3Key,
				Body: createReadStream(localPath),
				ContentLength: size,
			}),
		);
		log('Upload complete');

		// 3. Retention is handled by S3 lifecycle rule on the bucket.
		//    Set an expiration rule for 14 days on the postgres/ prefix.

		await postToSlackAboutSuccess(filename, sizeMB);
		log('Backup complete');
	} finally {
		try {
			unlinkSync(localPath);
		} catch {
			// ignore if already cleaned up
		}
		s3.destroy();
	}
}

main()
	.then(() => {
		process.exit(0);
	})
	.catch(async (err) => {
		log(`FATAL: ${err.message}`);
		if (err instanceof Error) {
			Sentry.captureException(err);
			await postToSlackAboutError(err);
			await Sentry.flush(5000);
		}
		process.exit(1);
	});
