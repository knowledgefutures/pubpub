const fromFirebaseJson = (string) =>
	JSON.parse(string, (_, value) => {
		if (
			value &&
			typeof value === 'object' &&
			Object.keys(value).every((key) => !Number.isNaN(parseInt(key, 10)))
		) {
			return Object.values(value).reduce((array, arrayEntry) => {
				return [...array, arrayEntry];
			}, []);
		}
		return value;
	});

const toFirebaseJson = (object) =>
	JSON.stringify(object, (_, value) => {
		if (Array.isArray(value)) {
			const res = {};
			value.forEach((entry, index) => {
				res[(index + 1).toString()] = entry;
			});
			return res;
		}
		return value;
	});

module.exports = { fromFirebaseJson: fromFirebaseJson, toFirebaseJson: toFirebaseJson };
