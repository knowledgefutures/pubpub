export const determinize = (deterministicKeys) => (object) => {
	const res = {};
	Object.keys(object).forEach((key) => {
		if (deterministicKeys.includes(key)) {
			res[key] = object[key];
		}
	});
	return res;
};
