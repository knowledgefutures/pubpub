import { Maybe } from './types';

const validExtensions = ['jpg', 'jpeg', 'png', 'gif'];

export const getResizedUrl = (url: Maybe<string>, type: string | null, dimensions: string) => {
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

	const prefix = type ? `${type}/` : '';
	const filepath = url.replace('https://assets.pubpub.org/', '');
	return `https://resize.pubpub.org/${prefix}${dimensions}/${filepath}`;
};

export const getDefaultResizedUrl = (url: string, align?: string) => {
	const width = align === 'breakout' ? 1920 : 800;
	return getResizedUrl(url, 'fit-in', `${width}x0`);
};
