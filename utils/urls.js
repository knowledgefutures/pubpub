export const parseUrl = (string) => {
	try {
		return new URL(string);
	} catch (error) {
		return null;
	}
};
