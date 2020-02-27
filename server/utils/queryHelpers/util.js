export const ensureSerialized = (item) => {
	if (Array.isArray(item)) {
		return item.map(ensureSerialized);
	}
	if (item && typeof item === 'object') {
		if (typeof item.toJSON === 'function') {
			return item.toJSON();
		}
		const res = {};
		Object.keys(item).forEach((key) => {
			res[key] = ensureSerialized(item[key]);
		});
		return res;
	}
	return item;
};
