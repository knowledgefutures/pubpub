export const withValue = <T, R>(
	value: T | null | undefined,
	callback: (value: T) => R,
): R | null => {
	if (value) {
		return callback(value);
	}

	return null;
};
