class AssertionError extends Error {
	name = 'AssertionError';
}

export function assert(condition: boolean, message = ''): asserts condition {
	if (!condition) {
		throw new AssertionError(message);
	}
}
