export const parseUrl = (url: string) => {
	try {
		return new URL(url);
	} catch (_error) {
		return null;
	}
};

export const isExternalUrl = (url: string) => {
	return !url.startsWith('/');
};
