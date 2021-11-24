import { SlugStatus } from 'types';

export const getSlugError = (slug: string, slugStatus: SlugStatus) => {
	if (!slug) {
		return 'Collection requires a slug';
	}
	if (slugStatus === 'used') {
		return 'This URL is not available because it is in use by another Page or Collection.';
	}
	if (slugStatus === 'reserved') {
		return 'This URL is not available because it is reserved by PubPub.';
	}
	return '';
};
