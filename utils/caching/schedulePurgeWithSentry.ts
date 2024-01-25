import * as Sentry from '@sentry/node';
import { createCachePurgeDebouncer } from './createCachePurgeDebouncer';

/**
 * We instantiate the purgedebouncer here to add the Sentry error handler now we can use this
 * schedulePurge function in other files
 */
export const { schedulePurge } = createCachePurgeDebouncer({
	errorHandler: Sentry.captureException,
});
