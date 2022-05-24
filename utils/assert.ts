class AssertionError extends Error {
	name = 'AssertionError';
}

export function assert(condition: boolean, message = ''): asserts condition {
	if (process.env.NODE_ENV === 'development') {
		if (!condition) {
			throw new AssertionError(message);
		}
	}
}
