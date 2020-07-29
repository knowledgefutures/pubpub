export const getHostnameForUrl = (url) => {
	try {
		const parsedUrl = new URL(url);
		return parsedUrl.hostname;
	} catch (_) {
		return url;
	}
};
