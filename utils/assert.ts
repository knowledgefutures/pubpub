import * as Sentry from '@sentry/node';

class AssertionError extends Error {
	name = 'AssertionError';
}

export function assert(condition: boolean, message = ''): asserts condition {
	if (!condition) {
		if (process.env.NODE_ENV !== 'production') {
			throw new AssertionError(message);
		} else {
			Sentry.captureException(new AssertionError(message));
		}
	}
}

export function exists<T>(value: T | null | undefined): value is T {
	return value != null;
}

export function expect<T>(value: T | null | undefined): T {
	assert(exists(value));
	return value;
}
