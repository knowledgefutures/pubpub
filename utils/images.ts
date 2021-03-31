import { Maybe } from './types';
import { btoaUniversal } from './strings';

type ResizerFit = 'cover' | 'contain' | 'fill' | 'inside' | 'outside';

const resizableExtensions = ['jpg', 'jpeg', 'png'];

export const getResizedUrl = (
	url: Maybe<string>,
	fit: ResizerFit,
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

	if (resizableExtensions.indexOf(extension) === -1) {
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
				withoutEnlargement: true,
			},
		},
	};

	return `https://resize-v3.pubpub.org/${btoaUniversal(JSON.stringify(imageRequest))}`;
};

export const getSrcSet = (url: string, fit: ResizerFit, width: number) => {
	const pixelDensities = [1, 2, 3];
	return pixelDensities
		.map((density) => {
			const resizedUrl = getResizedUrl(url, fit, width * density);
			return `${resizedUrl} ${density}x`;
		})
		.join(',');
};
