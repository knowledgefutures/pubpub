import { Maybe } from './types';
import { btoaUniversal } from './strings';

type validFit = 'cover' | 'contain' | 'fill' | 'inside' | 'outside';

const validExtensions = ['jpg', 'jpeg', 'png'];

export const getResizedUrl = (
	url: Maybe<string>,
	fit: validFit,
	width?: number,
	height?: number,
) => {
	/* Our resizer uses the AWS Serverless Image Handler CloudFormation */
	/* (https://github.com/awslabs/serverless-image-handler). 			*/
	/* That Handler uses sharp (https://sharp.pixelplumbing.com) as the */
	/* underlying engine and thus relevant documentation source 		*/
	if (!url || url.indexOf('https://assets.pubpub.org/') === -1) {
		return url || '';
	}
	const extension = url
		.split('.')
		.pop()!
		.toLowerCase();

	if (validExtensions.indexOf(extension) === -1) {
		return url;
	}

	const imageKey = url.replace('https://assets.pubpub.org/', '');
	const imageRequest = {
		bucket: 'assets.pubpub.org',
		key: imageKey,
		edits: {
			resize: {
				width,
				height,
				fit,
			},
		},
	};

	return `https://resize-v3.pubpub.org/${btoaUniversal(JSON.stringify(imageRequest))}`;
};

export const getDefaultResizedUrl = (url: string, align?: string) => {
	const width = align === 'breakout' ? 1920 : 800;
	return getResizedUrl(url, 'inside', width);
};
