import AWS from 'aws-sdk';

AWS.config.setPromisesDependency(Promise);
export const s3bucket = new AWS.S3({ params: { Bucket: 'assets.pubpub.org' } });
